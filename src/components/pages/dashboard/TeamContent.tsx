import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserInvitations from '@/components/admin/UserInvitations';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react';

const teamMembers = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Clinical Manager',
    department: 'Clinical Care',
    email: 'sarah.chen@fairlea.com.au',
    status: 'Active',
    compliance: 98,
    training: 95,
    lastActivity: '2 hours ago',
    avatar: 'SC',
    credentials: 'RN, BN'
  },
  {
    name: 'Michael Torres',
    role: 'Care Services Manager',
    department: 'Personal Care',
    email: 'michael.torres@fairlea.com.au',
    status: 'Active',
    compliance: 94,
    training: 89,
    lastActivity: '1 day ago',
    avatar: 'MT',
    credentials: 'EEN, Cert IV'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Training & Development Coordinator',
    department: 'Human Resources',
    email: 'emily.rodriguez@fairlea.com.au',
    status: 'Active',
    compliance: 96,
    training: 100,
    lastActivity: '3 hours ago',
    avatar: 'ER',
    credentials: 'Cert IV TAE'
  },
  {
    name: 'David Kim',
    role: 'Quality & Risk Manager',
    department: 'Governance',
    email: 'david.kim@fairlea.com.au',
    status: 'Active',
    compliance: 92,
    training: 87,
    lastActivity: '5 hours ago',
    avatar: 'DK',
    credentials: 'MBA, CRM'
  },
  {
    name: 'Lisa Wang',
    role: 'Lifestyle Coordinator',
    department: 'Lifestyle & Wellbeing',
    email: 'lisa.wang@fairlea.com.au',
    status: 'Away',
    compliance: 99,
    training: 93,
    lastActivity: '2 days ago',
    avatar: 'LW',
    credentials: 'Dip Community Services'
  },
  {
    name: 'Alex Johnson',
    role: 'Facility Manager',
    department: 'Environment & Facilities',
    email: 'alex.johnson@fairlea.com.au',
    status: 'Active',
    compliance: 91,
    training: 88,
    lastActivity: '1 hour ago',
    avatar: 'AJ',
    credentials: 'Cert III Facilities'
  }
];

const departmentStats = [
  { name: 'Clinical Care', members: 45, compliance: 96, training: 92 },
  { name: 'Personal Care', members: 78, compliance: 94, training: 89 },
  { name: 'Lifestyle & Wellbeing', members: 22, compliance: 98, training: 95 },
  { name: 'Administration', members: 15, compliance: 93, training: 87 },
  { name: 'Environment & Facilities', members: 18, compliance: 91, training: 85 },
  { name: 'Food Services', members: 12, compliance: 95, training: 90 }
];

const recentActivity = [
  {
    user: 'Dr. Sarah Chen',
    action: 'Completed Clinical Excellence Training',
    time: '2 hours ago',
    type: 'training'
  },
  {
    user: 'Michael Torres',
    action: 'Updated Personal Care Plan Procedures',
    time: '1 day ago',
    type: 'policy'
  },
  {
    user: 'Emily Rodriguez',
    action: 'Scheduled Quality Standards Training',
    time: '2 days ago',
    type: 'schedule'
  },
  {
    user: 'David Kim',
    action: 'Submitted Monthly Quality Report',
    time: '3 days ago',
    type: 'report'
  },
  {
    user: 'Lisa Wang',
    action: 'Completed Resident Activities Assessment',
    time: '4 days ago',
    type: 'assessment'
  }
];

export default function TeamContent() {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage team members and track their compliance progress</p>
        </div>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">Manage team members and track their compliance progress</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-coral hover:bg-coral/90 text-coral-foreground">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Members', value: '245', color: 'coral' },
          { label: 'Active Today', value: '187', color: 'success' },
          { label: 'Avg Compliance', value: '94.2%', color: 'info' },
          { label: 'Training Complete', value: '89.7%', color: 'success' },
          { label: 'Pending Reviews', value: '12', color: 'coral' }
        ].map((stat, index) => (
          <Card key={index} className="p-4 text-center">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
          </Card>
        ))}
      </div>

      {/* Team Members Grid */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
          <Button variant="outline" size="sm">
            View All (245)
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member, index) => (
            <Card key={index} className="p-4 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-medium text-sm">
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{member.name}</h4>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                    <p className="text-xs text-muted-foreground">{member.department}</p>
                  </div>
                </div>
                <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                  {member.status}
                </Badge>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Compliance</span>
                  <span className="font-medium text-success">{member.compliance}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Training</span>
                  <span className="font-medium text-info">{member.training}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Active</span>
                  <span className="text-muted-foreground">{member.lastActivity}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-4 w-4 mr-1" />
                  Contact
                </Button>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Department Performance & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Department Performance</h3>
            <Button variant="outline" size="sm">
              View Details
            </Button>
          </div>
          <div className="space-y-4">
            {departmentStats.map((dept, index) => (
              <div key={index} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{dept.name}</h4>
                  <span className="text-sm text-muted-foreground">{dept.members} members</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Compliance: </span>
                    <span className="font-medium text-success">{dept.compliance}%</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Training: </span>
                    <span className="font-medium text-info">{dept.training}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Team Activity</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-2 bg-background rounded">
                  {activity.type === 'training' && <Award className="h-4 w-4 text-success" />}
                  {activity.type === 'policy' && <CheckCircle className="h-4 w-4 text-info" />}
                  {activity.type === 'schedule' && <Calendar className="h-4 w-4 text-coral" />}
                  {activity.type === 'report' && <TrendingUp className="h-4 w-4 text-success" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{activity.user}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Team Performance Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Team Performance Trends</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">Monthly</Button>
            <Button variant="outline" size="sm">Quarterly</Button>
          </div>
        </div>
        <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground">Performance Analytics Coming Soon</h4>
            <p className="text-muted-foreground max-w-md mx-auto">
              Interactive charts showing team compliance trends, training progress, and performance metrics
            </p>
          </div>
        </div>
      </Card>
      </TabsContent>

      <TabsContent value="invitations">
        <UserInvitations />
      </TabsContent>
    </Tabs>
  );
}