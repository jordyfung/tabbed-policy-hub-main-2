import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Clock, Award, BookOpen, Users, AlertTriangle, Calendar, Target } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import CourseManagement from '@/components/training/CourseManagement';
import CourseAssignments from '@/components/training/CourseAssignments';
import TrainingProgress from '@/components/training/TrainingProgress';

export default function EnhancedTrainingContent() {
  const { isAdmin, viewMode } = useAuth();

  // If user is in staff view or not an admin, show only their training progress
  if (!isAdmin || viewMode === 'staff') {
    return <TrainingProgress />;
  }

  // Admin view with full training management
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Training Management</h1>
          <p className="text-foreground/60 mt-2">Comprehensive training and development system</p>
        </div>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* Training Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { title: 'Total Courses', value: '24', icon: BookOpen, color: 'info' },
            { title: 'Active Assignments', value: '156', icon: Target, color: 'primary' },
            { title: 'Completion Rate', value: '89%', icon: Award, color: 'success' },
            { title: 'Overdue Training', value: '12', icon: AlertTriangle, color: 'warning' }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground/60">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg bg-${stat.color}/10 text-${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Training Activity</h3>
            <div className="space-y-3">
              {[
                { user: 'Sarah Chen', course: 'Medication Management', action: 'Completed', time: '2 hours ago' },
                { user: 'Michael Torres', course: 'Infection Control', action: 'Started', time: '4 hours ago' },
                { user: 'Emily Rodriguez', course: 'Quality Standards', action: 'Completed', time: '1 day ago' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{activity.user}</p>
                    <p className="text-xs text-foreground/60">{activity.action} "{activity.course}"</p>
                  </div>
                  <span className="text-xs text-foreground/60">{activity.time}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {[
                { course: 'Manual Handling', due: '2 days', staff: 8, priority: 'high' },
                { course: 'Fire Safety', due: '1 week', staff: 15, priority: 'medium' },
                { course: 'CPR Renewal', due: '2 weeks', staff: 6, priority: 'high' }
              ].map((deadline, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-foreground">{deadline.course}</p>
                    <p className="text-xs text-foreground/60">{deadline.staff} staff members</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">Due in {deadline.due}</p>
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      deadline.priority === 'high' ? 'bg-critical' : 'bg-warning'
                    }`}></span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="courses">
        <CourseManagement />
      </TabsContent>

      <TabsContent value="assignments">
        <CourseAssignments />
      </TabsContent>

      <TabsContent value="progress">
        <TrainingProgress />
      </TabsContent>
    </Tabs>
  );
}