import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserInvitations from '@/components/admin/UserInvitations';
import { 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  ArrowUpDown
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'

const teamMembers = [
  {
    id: 'USR-001',
    name: 'Dr. Sarah Chen',
    role: 'Clinical Manager',
    department: 'Clinical Care',
    email: 'sarah.chen@fairlea.com.au',
    status: 'Active',
    compliance: 98,
    training: 95,
    lastActivity: '2 hours ago',
    avatar: 'SC',
  },
  {
    id: 'USR-002',
    name: 'Michael Torres',
    role: 'Care Services Manager',
    department: 'Personal Care',
    email: 'michael.torres@fairlea.com.au',
    status: 'Active',
    compliance: 94,
    training: 89,
    lastActivity: '1 day ago',
    avatar: 'MT',
  },
  {
    id: 'USR-003',
    name: 'Emily Rodriguez',
    role: 'Training & Development Coordinator',
    department: 'Human Resources',
    email: 'emily.rodriguez@fairlea.com.au',
    status: 'Active',
    compliance: 96,
    training: 100,
    lastActivity: '3 hours ago',
    avatar: 'ER',
  },
  {
    id: 'USR-004',
    name: 'David Kim',
    role: 'Quality & Risk Manager',
    department: 'Governance',
    email: 'david.kim@fairlea.com.au',
    status: 'Active',
    compliance: 92,
    training: 87,
    lastActivity: '5 hours ago',
    avatar: 'DK',
  },
  {
    id: 'USR-005',
    name: 'Lisa Wang',
    role: 'Lifestyle Coordinator',
    department: 'Lifestyle & Wellbeing',
    email: 'lisa.wang@fairlea.com.au',
    status: 'Away',
    compliance: 99,
    training: 93,
    lastActivity: '2 days ago',
    avatar: 'LW',
  },
  {
    id: 'USR-006',
    name: 'Alex Johnson',
    role: 'Facility Manager',
    department: 'Environment & Facilities',
    email: 'alex.johnson@fairlea.com.au',
    status: 'Active',
    compliance: 91,
    training: 88,
    lastActivity: '1 hour ago',
    avatar: 'AJ',
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
         <div className="flex items-center space-x-3">
           <Button variant="outline" size="sm">
             <Search className="h-4 w-4 mr-2" />
             Search members...
           </Button>
           <Button variant="outline" size="sm">
             <Filter className="h-4 w-4 mr-2" />
             Filter
           </Button>
         </div>
        <div className="flex items-center space-x-3">
          <Button className="bg-coral hover:bg-coral/90 text-coral-foreground">
            <UserPlus className="h-4 w-4 mr-2" />
            Onboard New User
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

      {/* Team Members Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox />
              </TableHead>
              <TableHead className="w-[250px]">
                <Button variant="ghost" size="sm">
                  Member
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Compliance</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>
                <Button variant="ghost" size="sm">
                  Role
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-medium text-sm">
                      {member.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-foreground">{member.name}</div>
                      <div className="text-sm text-muted-foreground">{member.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={member.status === 'Active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={member.compliance} className="w-24" />
                    <span className="text-sm font-medium text-muted-foreground">{member.compliance}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Progress value={member.training} className="w-24" />
                    <span className="text-sm font-medium text-muted-foreground">{member.training}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{member.role}</div>
                  <div className="text-sm text-muted-foreground">{member.department}</div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem>Assign Training</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        Deactivate User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      </TabsContent>

      <TabsContent value="invitations">
        <UserInvitations />
      </TabsContent>
    </Tabs>
  );
}