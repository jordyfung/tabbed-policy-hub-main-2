import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, FileCheck, Shield, UserCheck, AlertTriangle, Clock } from 'lucide-react';
import AnalyticsContent from './dashboard/AnalyticsContent';
import ReportsContent from './dashboard/ReportsContent';
import TeamContent from './dashboard/TeamContent';
import QualityStandardsContent from './dashboard/QualityStandardsContent';
import PermissionsContent from './dashboard/PermissionsContent';

interface DashboardContentProps {
  activeSubTab?: string;
}

export default function DashboardContent({ activeSubTab = 'overview' }: DashboardContentProps) {
  // Render content based on active sub-tab
  if (activeSubTab === 'analytics') {
    return <AnalyticsContent />;
  }
  
  if (activeSubTab === 'reports') {
    return <ReportsContent />;
  }
  
  if (activeSubTab === 'team') {
    return <TeamContent />;
  }

  if (activeSubTab === 'standards') {
    return <QualityStandardsContent />;
  }

  if (activeSubTab === 'permissions') {
    return <PermissionsContent />;
  }
  const stats = [
    {
      title: 'ACQSC Compliance',
      value: '92%',
      change: '+4%',
      icon: Shield,
      color: 'success'
    },
    {
      title: 'Quality Standards Met',
      value: '6/8',
      change: '+1',
      icon: UserCheck,
      color: 'success'
    },
    {
      title: 'Staff Compliance',
      value: '91%',
      change: '+3%',
      icon: Users,
      color: 'info'
    },
    {
      title: 'Open Findings',
      value: '4',
      change: '-2',
      icon: AlertTriangle,
      color: 'warning'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Aged Care Dashboard</h1>
        <p className="text-foreground/60 mt-2">Monitor Quality Standards compliance and aged care performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClass = {
            coral: 'text-coral bg-coral/10',
            success: 'text-success bg-success/10',
            info: 'text-info bg-info/10',
            warning: 'text-warning bg-warning/10'
          }[stat.color];

          return (
            <Card key={index} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground/60">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{stat.value}</p>
                  <p className="text-sm text-success mt-1">{stat.change} from last month</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClass}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'Care plan updated', item: 'Quality Standard 3 compliance', time: '1 hour ago', color: 'success' },
              { action: 'Training completed', item: 'Medication Management', time: '3 hours ago', color: 'success' },
              { action: 'Incident reported', item: 'Minor fall - resident safe', time: '6 hours ago', color: 'warning' },
              { action: 'Audit scheduled', item: 'ACQSC Assessment', time: '1 day ago', color: 'info' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/50">
                <div className={`w-2 h-2 rounded-full bg-${activity.color}`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="text-xs text-foreground/60">{activity.item}</p>
                </div>
                <span className="text-xs text-foreground/60">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Tasks</h3>
          <div className="space-y-4">
            {[
              { task: 'Update care plans for new residents', due: 'Due in 1 day', priority: 'high' },
              { task: 'Complete mandatory training modules', due: 'Due in 3 days', priority: 'high' },
              { task: 'Review medication administration records', due: 'Due in 5 days', priority: 'medium' },
              { task: 'Conduct staff supervision sessions', due: 'Due in 1 week', priority: 'medium' },
              { task: 'Environmental safety audit', due: 'Due in 2 weeks', priority: 'low' }
            ].map((task, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{task.task}</p>
                  <p className="text-xs text-foreground/60">{task.due}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  task.priority === 'high' ? 'bg-critical/20 text-critical' :
                  task.priority === 'medium' ? 'bg-warning/20 text-warning' :
                  'bg-info/20 text-info'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}