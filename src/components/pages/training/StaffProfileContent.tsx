import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Clock, Trophy, Star, Calendar, User } from 'lucide-react';

interface StaffMember {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  role: string;
}

interface Assignment {
  id: string;
  course_id: string;
  due_date: string;
  completion_count: number;
  last_completed_at: string;
  course: {
    title: string;
    is_mandatory: boolean;
  };
}

interface Achievement {
  achievement_name: string;
  points: number;
  earned_at: string;
}

export default function StaffProfileContent() {
  const { profile, isAdmin } = useAuth();
  const [selectedStaff, setSelectedStaff] = useState<string>(profile?.user_id || '');
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) {
      fetchStaffMembers();
    }
    if (selectedStaff) {
      fetchStaffData();
    }
  }, [selectedStaff, isAdmin]);

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

  const fetchStaffData = async () => {
    if (!selectedStaff) return;
    
    setLoading(true);
    try {
      // Fetch assignments
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('course_assignments')
        .select(`
          id,
          course_id,
          due_date,
          completion_count,
          last_completed_at,
          course:courses(title, is_mandatory)
        `)
        .eq('assigned_to', selectedStaff);

      if (assignmentError) throw assignmentError;

      // Fetch achievements
      const { data: achievementData, error: achievementError } = await supabase
        .from('user_achievements')
        .select('achievement_name, points, earned_at')
        .eq('user_id', selectedStaff)
        .order('earned_at', { ascending: false });

      if (achievementError) throw achievementError;

      setAssignments(assignmentData || []);
      setAchievements(achievementData || []);
    } catch (error) {
      console.error('Error fetching staff data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStaff = () => {
    return staffMembers.find(s => s.user_id === selectedStaff);
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    const completed = assignments.filter(a => a.completion_count > 0).length;
    return Math.round((completed / assignments.length) * 100);
  };

  const getTimeAtCompany = () => {
    const staff = getCurrentStaff();
    if (!staff) return '';
    
    const startDate = new Date(staff.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  const getTotalXP = () => {
    return achievements.reduce((total, achievement) => total + achievement.points, 0);
  };

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.completion_count > 0) {
      return <Badge variant="secondary" className="bg-success/10 text-success">Completed</Badge>;
    }
    
    if (assignment.due_date) {
      const dueDate = new Date(assignment.due_date);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        return <Badge variant="destructive">Overdue</Badge>;
      } else if (daysUntilDue <= 7) {
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Due Soon</Badge>;
      }
    }
    
    return <Badge variant="outline">Pending</Badge>;
  };

  const currentStaff = getCurrentStaff();

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isAdmin ? 'Staff Training Profile' : 'My Training Profile'}
          </h1>
          <p className="text-foreground/60 mt-2">
            {isAdmin ? 'View individual staff training progress and history' : 'Track your training progress and achievements'}
          </p>
        </div>
        
        {isAdmin && (
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select staff member" />
            </SelectTrigger>
            <SelectContent>
              {staffMembers.map((staff) => (
                <SelectItem key={staff.user_id} value={staff.user_id}>
                  {staff.first_name} {staff.last_name} ({staff.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {currentStaff && (
        <>
          {/* Staff Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-coral/10 text-coral">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{currentStaff.first_name} {currentStaff.last_name}</p>
                  <p className="text-sm text-foreground/60 capitalize">{currentStaff.role}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Calendar className="h-5 w-5 text-success" />
                <span className="text-sm font-medium text-foreground/60">Time at Company</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{getTimeAtCompany()}</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <BookOpen className="h-5 w-5 text-info" />
                <span className="text-sm font-medium text-foreground/60">Training Progress</span>
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-foreground">{calculateProgress()}%</p>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center space-x-3 mb-2">
                <Trophy className="h-5 w-5 text-coral" />
                <span className="text-sm font-medium text-foreground/60">Total XP</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{getTotalXP()}</p>
            </Card>
          </div>

          {/* Training Assignments */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Current Assignments</h3>
            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start space-x-3">
                      <BookOpen className="h-5 w-5 text-info mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">{assignment.course.title}</p>
                        {assignment.due_date && (
                          <p className="text-sm text-foreground/60">
                            Due: {new Date(assignment.due_date).toLocaleDateString()}
                          </p>
                        )}
                        {assignment.last_completed_at && (
                          <p className="text-sm text-foreground/60">
                            Last completed: {new Date(assignment.last_completed_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {assignment.course.is_mandatory && (
                        <Badge variant="outline" className="bg-critical/10 text-critical">Mandatory</Badge>
                      )}
                      {getStatusBadge(assignment)}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-foreground/60 text-center py-8">No training assignments found.</p>
              )}
            </div>
          </Card>

          {/* Recent Achievements */}
          {achievements.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {achievements.slice(0, 6).map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                    <Star className="h-5 w-5 text-coral" />
                    <div>
                      <p className="font-medium text-foreground">{achievement.achievement_name}</p>
                      <p className="text-sm text-foreground/60">{achievement.points} XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}