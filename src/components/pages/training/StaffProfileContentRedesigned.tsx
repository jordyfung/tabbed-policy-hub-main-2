import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useAssignments } from '@/hooks/useAssignments';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Play } from 'lucide-react';

// Import new components
import ProfileHeader from '@/components/training/ProfileHeader';
import PrimaryCtaCard from '@/components/training/PrimaryCtaCard';
import ComplianceSummary from '@/components/training/ComplianceSummary';
import NextUpCard from '@/components/training/NextUpCard';
import AssignmentsList from '@/components/training/AssignmentsList';
import HistoryPanel from '@/components/training/HistoryPanel';

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  role: string;
}

interface HistoryItem {
  id: string;
  title: string;
  completedAt: string;
  score?: number;
  certificateUrl?: string;
  standards?: string[];
}

export default function StaffProfileContentRedesigned() {
  const { t } = useTranslation();
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  
  const [selectedUserId, setSelectedUserId] = useState<string>(profile?.user_id || '');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the new useAssignments hook
  const {
    assignments,
    groups,
    nextUp,
    compliance,
    loading: assignmentsLoading,
    error: assignmentsError
  } = useAssignments({ 
    userId: selectedUserId,
    enabled: !!selectedUserId 
  });

  useEffect(() => {
    if (isAdmin) {
      fetchStaffMembers();
    }
    if (selectedUserId) {
      fetchHistory();
    }
  }, [selectedUserId, isAdmin]);

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, first_name, last_name, email, created_at, role')
        .order('first_name');

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      // Fetch completed assignments with scores
      const { data, error } = await supabase
        .from('course_completions')
        .select(`
          id,
          completed_at,
          score,
          assignment_id,
          course_assignments!inner(
            course:courses(title)
          )
        `)
        .eq('completed_by', selectedUserId)
        .order('completed_at', { ascending: false });

      if (error) throw error;

      const historyItems: HistoryItem[] = (data || []).map((completion: any) => ({
        id: completion.id,
        title: completion.course_assignments?.course?.title || 'Unknown Course',
        completedAt: completion.completed_at,
        score: completion.score,
        certificateUrl: undefined, // TODO: Add certificate URL when available
        standards: [], // TODO: Add standards mapping
      }));

      setHistory(historyItems);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (assignmentId: string) => {
    toast({ 
      title: t('trainingProfile.toasts.start'),
      description: 'Launching course...'
    });
    // TODO: Implement actual course launch
  };

  const handleResume = (assignmentId: string) => {
    toast({ 
      title: t('trainingProfile.toasts.start'),
      description: 'Resuming course...'
    });
    // TODO: Implement actual course resume
  };

  const handleViewDetails = (assignmentId: string) => {
    toast({ 
      title: t('trainingProfile.toasts.viewDetails'),
      description: 'Opening course details...'
    });
    // TODO: Implement course details view
  };

  const handleViewSyllabus = (assignmentId: string) => {
    toast({ 
      title: 'View Syllabus',
      description: 'Opening course syllabus...'
    });
    // TODO: Implement syllabus view
  };

  const handleReportIssue = (assignmentId: string) => {
    toast({ 
      title: 'Report Issue',
      description: 'Opening issue report form...'
    });
    // TODO: Implement issue reporting
  };

  const handleMarkDone = (assignmentId: string) => {
    toast({ 
      title: t('trainingProfile.toasts.markedDone'),
      description: 'Assignment marked as completed'
    });
    // TODO: Implement actual completion marking
  };

  const handleViewCertificate = (certificateUrl: string) => {
    toast({ 
      title: 'View Certificate',
      description: 'Opening certificate...'
    });
    // TODO: Implement certificate viewing
  };

  if (loading || assignmentsLoading) {
    return (
      <div className="space-y-6 animate-in fade-in-0 duration-300">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0,1,2].map((i) => (
            <Card key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[0,1,2].map((i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-start space-x-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-56" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (assignmentsError) {
    return (
      <div className="text-center py-12">
        <div className="text-destructive mb-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium">Error Loading Assignments</h3>
          <p className="text-sm text-foreground/60">{assignmentsError}</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  const currentUser = staffMembers.find(s => s.user_id === selectedUserId);
  if (!currentUser) {
    return (
      <div className="text-center py-12">
        <div className="text-foreground/60 mb-4">
          <BookOpen className="h-12 w-12 mx-auto mb-4" />
          <h3 className="text-lg font-medium">User Not Found</h3>
          <p className="text-sm">The selected user could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <ProfileHeader
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        staffMembers={staffMembers}
        isAdmin={isAdmin}
      />

      {/* Primary CTA */}
      <PrimaryCtaCard
        nextUp={nextUp}
        onStart={handleStart}
        onResume={handleResume}
      />

      {/* Compliance Summary */}
      <ComplianceSummary compliance={compliance} />

      {/* Next Up Card */}
      {nextUp && (
        <NextUpCard
          nextUp={nextUp}
          onStart={handleStart}
          onResume={handleResume}
        />
      )}

      {/* Assignments List */}
      <AssignmentsList
        groups={groups}
        onStart={handleStart}
        onResume={handleResume}
        onViewDetails={handleViewDetails}
        onViewSyllabus={handleViewSyllabus}
        onReportIssue={handleReportIssue}
        onMarkDone={handleMarkDone}
        allowManualCompletion={false} // TODO: Make this configurable based on role/policy
      />

      {/* History Panel */}
      <HistoryPanel
        history={history}
        onViewCertificate={handleViewCertificate}
      />
    </div>
  );
}
