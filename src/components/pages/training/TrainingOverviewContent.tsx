import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Award, AlertTriangle, Target, Users, TrendingUp, Calendar } from 'lucide-react';

interface OverviewStats {
  totalCourses: number;
  activeAssignments: number;
  completionRate: number;
  overdueTraining: number;
  totalStaff: number;
  mandatoryCourses: number;
}

interface RecentActivity {
  user_name: string;
  course_title: string;
  action: string;
  timestamp: string;
}

interface UpcomingDeadline {
  course_title: string;
  due_date: string;
  staff_count: number;
  is_mandatory: boolean;
}

export default function TrainingOverviewContent() {
  const [stats, setStats] = useState<OverviewStats>({
    totalCourses: 0,
    activeAssignments: 0,
    completionRate: 0,
    overdueTraining: 0,
    totalStaff: 0,
    mandatoryCourses: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<UpcomingDeadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      // Fetch basic stats
      const [coursesData, assignmentsData, staffData] = await Promise.all([
        supabase.from('courses').select('id, is_mandatory'),
        supabase.from('course_assignments').select('id, completion_count, due_date'),
        supabase.from('profiles').select('id, role')
      ]);

      const totalCourses = coursesData.data?.length || 0;
      const mandatoryCourses = coursesData.data?.filter(c => c.is_mandatory).length || 0;
      const activeAssignments = assignmentsData.data?.length || 0;
      const totalStaff = staffData.data?.length || 0;
      
      const completedAssignments = assignmentsData.data?.filter(a => a.completion_count > 0).length || 0;
      const completionRate = activeAssignments > 0 ? Math.round((completedAssignments / activeAssignments) * 100) : 0;
      
      const now = new Date();
      const overdueTraining = assignmentsData.data?.filter(a => 
        a.due_date && new Date(a.due_date) < now && a.completion_count === 0
      ).length || 0;

      setStats({
        totalCourses,
        activeAssignments,
        completionRate,
        overdueTraining,
        totalStaff,
        mandatoryCourses
      });

      // Fetch recent activity
      const { data: activityData } = await supabase
        .from('course_completions')
        .select(`
          completed_at,
          assignment:course_assignments(
            course:courses(title),
            assigned_to
          ),
          completed_by
        `)
        .order('completed_at', { ascending: false })
        .limit(10);

      // Transform activity data
      const activity: RecentActivity[] = [];
      for (const completion of activityData || []) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', completion.completed_by)
          .single();

        if (profileData) {
          activity.push({
            user_name: `${profileData.first_name} ${profileData.last_name}`,
            course_title: completion.assignment?.course?.title || 'Unknown Course',
            action: 'Completed',
            timestamp: completion.completed_at
          });
        }
      }
      setRecentActivity(activity);

      // Fetch upcoming deadlines
      const { data: deadlineData } = await supabase
        .from('course_assignments')
        .select(`
          due_date,
          completion_count,
          course:courses(title, is_mandatory)
        `)
        .gte('due_date', new Date().toISOString())
        .eq('completion_count', 0)
        .order('due_date', { ascending: true })
        .limit(10);

      // Group by course and count staff
      const deadlineMap = new Map();
      deadlineData?.forEach(assignment => {
        const key = assignment.course?.title;
        if (key) {
          if (deadlineMap.has(key)) {
            deadlineMap.get(key).staff_count++;
          } else {
            deadlineMap.set(key, {
              course_title: key,
              due_date: assignment.due_date,
              staff_count: 1,
              is_mandatory: assignment.course?.is_mandatory || false
            });
          }
        }
      });

      setUpcomingDeadlines(Array.from(deadlineMap.values()));

    } catch (error) {
      console.error('Error fetching overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading overview...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Training Overview</h1>
        <p className="text-foreground/60 mt-2">Comprehensive view of training progress and compliance across the organization</p>
      </div>

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Total Courses</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.totalCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10 text-info">
              <BookOpen className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Active Assignments</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.activeAssignments}</p>
            </div>
            <div className="p-3 rounded-lg bg-coral/10 text-coral">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Completion Rate</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.completionRate}%</p>
              <Progress value={stats.completionRate} className="h-1 mt-2" />
            </div>
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Overdue Training</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.overdueTraining}</p>
            </div>
            <div className="p-3 rounded-lg bg-critical/10 text-critical">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Staff Members</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.totalStaff}</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10 text-info">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground/60">Mandatory Courses</p>
              <p className="text-2xl font-bold text-foreground mt-2">{stats.mandatoryCourses}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 text-warning">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Training Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Recent Training Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.user_name}</p>
                    <p className="text-xs text-foreground/60">{activity.action} "{activity.course_title}"</p>
                  </div>
                  <span className="text-xs text-foreground/60">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              ))
            ) : (
              <p className="text-foreground/60 text-center py-4">No recent activity</p>
            )}
          </div>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Deadlines
          </h3>
          <div className="space-y-3">
            {upcomingDeadlines.length > 0 ? (
              upcomingDeadlines.map((deadline, index) => {
                const daysUntil = getDaysUntilDue(deadline.due_date);
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-foreground">{deadline.course_title}</p>
                      <p className="text-xs text-foreground/60">{deadline.staff_count} staff member{deadline.staff_count > 1 ? 's' : ''}</p>
                    </div>
                    <div className="text-right flex items-center space-x-2">
                      <div>
                        <p className="text-sm font-medium">
                          {daysUntil === 0 ? 'Due today' : `${daysUntil} day${daysUntil > 1 ? 's' : ''}`}
                        </p>
                      </div>
                      {deadline.is_mandatory && (
                        <Badge variant="outline" className="bg-critical/10 text-critical text-xs">Mandatory</Badge>
                      )}
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        daysUntil <= 3 ? 'bg-critical' : daysUntil <= 7 ? 'bg-warning' : 'bg-success'
                      }`}></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-foreground/60 text-center py-4">No upcoming deadlines</p>
            )}
          </div>
        </Card>
      </div>

      {/* Compliance Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Mandatory Training Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-success/10 rounded-lg">
            <p className="text-2xl font-bold text-success">{stats.completionRate}%</p>
            <p className="text-sm text-foreground/60">Overall Compliance</p>
          </div>
          <div className="text-center p-4 bg-warning/10 rounded-lg">
            <p className="text-2xl font-bold text-warning">{stats.overdueTraining}</p>
            <p className="text-sm text-foreground/60">Overdue Items</p>
          </div>
          <div className="text-center p-4 bg-info/10 rounded-lg">
            <p className="text-2xl font-bold text-info">{stats.mandatoryCourses}</p>
            <p className="text-sm text-foreground/60">Mandatory Courses</p>
          </div>
          <div className="text-center p-4 bg-coral/10 rounded-lg">
            <p className="text-2xl font-bold text-coral">{upcomingDeadlines.length}</p>
            <p className="text-sm text-foreground/60">Upcoming Deadlines</p>
          </div>
        </div>
      </Card>
    </div>
  );
}