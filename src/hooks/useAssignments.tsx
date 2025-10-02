import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Assignment, AssignmentGroup, ComplianceSummary, NextUpAssignment, AssignmentStatus } from '@/integrations/supabase/types';

interface UseAssignmentsOptions {
  userId: string;
  enabled?: boolean;
}

interface UseAssignmentsReturn {
  assignments: Assignment[];
  groups: AssignmentGroup[];
  nextUp: NextUpAssignment;
  compliance: ComplianceSummary;
  loading: boolean;
  error: string | null;
}

// Simple demo mapping by course title keywords; replace with backend mapping when ready
function getStandardsForCourseTitle(title: string): string[] {
  const t = title.toLowerCase();
  const mapped: Set<string> = new Set();
  if (t.includes('infection') || t.includes('clinical')) {
    mapped.add('Std 5');
    mapped.add('Std 4');
  }
  if (t.includes('safety')) {
    mapped.add('Std 4');
  }
  if (t.includes('customer') || t.includes('service') || t.includes('dignity') || t.includes('choice')) {
    mapped.add('Std 1');
    mapped.add('Std 3');
  }
  if (t.includes('nutrition') || t.includes('food')) {
    mapped.add('Std 6');
  }
  if (mapped.size === 0) {
    mapped.add('Std 3');
  }
  return Array.from(mapped);
}

function deriveAssignmentStatus(assignment: any): AssignmentStatus {
  const now = new Date();
  const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
  
  // If completed, it's completed
  if (assignment.completion_count > 0) {
    return 'completed';
  }
  
  // If overdue (due date in past and not completed)
  if (dueDate && dueDate < now) {
    return 'overdue';
  }
  
  // If has progress but not completed, it's in progress
  if (assignment.progress_percent && assignment.progress_percent > 0) {
    return 'in_progress';
  }
  
  return 'not_started';
}

function calculateProgressPercent(assignment: any): number {
  // If completed, 100%
  if (assignment.completion_count > 0) {
    return 100;
  }
  
  // Use SCORM progress if available, otherwise 0
  return assignment.progress_percent || 0;
}

export function useAssignments({ userId, enabled = true }: UseAssignmentsOptions): UseAssignmentsReturn {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !userId) {
      setLoading(false);
      return;
    }

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch assignments with course details
        const { data, error: fetchError } = await supabase
          .from('course_assignments')
          .select(`
            id,
            course_id,
            due_date,
            completion_count,
            last_completed_at,
            is_mandatory,
            course:courses(
              id,
              title,
              duration_hours,
              is_mandatory
            )
          `)
          .eq('assigned_to', userId)
          .order('due_date', { ascending: true });

        if (fetchError) throw fetchError;

        // Transform to our Assignment type
        const transformedAssignments: Assignment[] = (data || []).map((assignment: any) => {
          const status = deriveAssignmentStatus(assignment);
          const progressPercent = calculateProgressPercent(assignment);
          
          return {
            id: assignment.id,
            title: assignment.course?.title || 'Unknown Course',
            dueDate: assignment.due_date,
            isMandatory: assignment.is_mandatory || assignment.course?.is_mandatory || false,
            progressPercent,
            lastLaunchedAt: assignment.last_launched_at,
            estimatedMinutes: assignment.course?.duration_hours ? assignment.course.duration_hours * 60 : undefined,
            status,
            courseId: assignment.course_id,
            standards: getStandardsForCourseTitle(assignment.course?.title || ''),
          };
        });

        setAssignments(transformedAssignments);
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [userId, enabled]);

  // Group assignments
  const groups: AssignmentGroup[] = [
    {
      title: 'Overdue',
      assignments: assignments.filter(a => a.status === 'overdue'),
      emptyMessage: 'No overdue assignments',
    },
    {
      title: 'Due Soon',
      assignments: assignments.filter(a => {
        if (a.status === 'completed' || a.status === 'overdue') return false;
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilDue <= 7;
      }),
      emptyMessage: 'No assignments due soon',
    },
    {
      title: 'In Progress',
      assignments: assignments.filter(a => a.status === 'in_progress'),
      emptyMessage: 'No courses in progress',
    },
    {
      title: 'Not Started',
      assignments: assignments.filter(a => a.status === 'not_started'),
      emptyMessage: 'No pending assignments',
    },
  ];

  // Find next up assignment (first overdue, then first due soon, then first in progress, then first not started)
  const nextUp: NextUpAssignment = (() => {
    const overdue = assignments.find(a => a.status === 'overdue');
    if (overdue) return overdue;

    const dueSoon = assignments.find(a => {
      if (a.status === 'completed' || a.status === 'overdue') return false;
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7;
    });
    if (dueSoon) return dueSoon;

    const inProgress = assignments.find(a => a.status === 'in_progress');
    if (inProgress) return inProgress;

    const notStarted = assignments.find(a => a.status === 'not_started');
    return notStarted || null;
  })();

  // Calculate compliance summary
  const compliance: ComplianceSummary = (() => {
    const mandatoryAssignments = assignments.filter(a => a.isMandatory);
    const completedMandatory = mandatoryAssignments.filter(a => a.status === 'completed');
    const overdueCount = assignments.filter(a => a.status === 'overdue').length;
    const dueSoonCount = assignments.filter(a => {
      if (a.status === 'completed' || a.status === 'overdue') return false;
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7;
    }).length;

    return {
      mandatoryCoverage: mandatoryAssignments.length > 0 
        ? Math.round((completedMandatory.length / mandatoryAssignments.length) * 100)
        : 0,
      overdueCount,
      dueSoonCount,
    };
  })();

  return {
    assignments,
    groups,
    nextUp,
    compliance,
    loading,
    error,
  };
}
