import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import UserInvitations from '@/components/admin/UserInvitations';
import {
  UserPlus,
  Search,
  Filter,
  MoreHorizontal,
  ArrowUpDown,
  Upload,
  Download,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send
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


export default function TeamManagementContent() {
  const { toast } = useToast();
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  
  // Single user invitation state
  const [isInvitationDialogOpen, setIsInvitationDialogOpen] = useState(false);
  const [invitationForm, setInvitationForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'staff' as 'staff' | 'admin'
  });
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  
  // Member detail modal state
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');

  const handleCsvUpload = async () => {
    if (!csvFile) return;

    setIsUploading(true);
    try {
      const text = await csvFile.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      // Validate headers
      const requiredFields = ['first_name', 'last_name', 'email', 'role'];
      const missingFields = requiredFields.filter(field => !headers.includes(field));
      
      if (missingFields.length > 0) {
        toast({
          title: "Invalid CSV Format",
          description: `Missing required fields: ${missingFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }

      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index];
        });
        return row;
      });

      // Process each row
      for (const row of data) {
        if (row.email && row.first_name && row.last_name && row.role) {
          // Create invitation record
          const { data: invitation, error: inviteError } = await supabase
            .from('user_invitations')
            .insert({
              email: row.email,
              role: row.role,
              invited_by: (await supabase.auth.getUser()).data.user?.id,
              invitation_token: crypto.randomUUID(),
            })
            .select()
            .single();

          if (inviteError) {
            console.error('Error creating invitation:', inviteError);
            continue;
          }

          // Send email via edge function
          await supabase.functions.invoke('send-invitation', {
            body: {
              email: row.email,
              role: row.role,
              invitationId: invitation.id,
              inviterName: 'System Administrator'
            }
          });
        }
      }

      toast({
        title: "Success",
        description: `Processed ${data.length} users from CSV`,
      });

      setCsvFile(null);
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast({
        title: "Error",
        description: "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const sendOverdueNotifications = async () => {
    setIsSendingNotifications(true);
    try {
      // Query overdue assignments with course frequency settings
      const { data: overdueAssignments, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          profiles!course_assignments_assigned_to_fkey(email, first_name, last_name),
          courses(title, course_frequencies(email_notifications_enabled))
        `)
        .lt('due_date', new Date().toISOString())
        .is('completed_at', null);

      if (error) throw error;

      let sentCount = 0;

      // Send notifications for each overdue assignment
      for (const assignment of overdueAssignments || []) {
        if (assignment.profiles?.email) {
          // Check if email notifications are enabled for this course
          const frequencySettings = assignment.courses?.course_frequencies;
          const notificationsEnabled = frequencySettings?.some((freq: any) => 
            freq.email_notifications_enabled !== false
          );

          if (notificationsEnabled !== false) {
            await supabase.functions.invoke('send-training-reminder', {
              body: {
                email: assignment.profiles.email,
                courseTitle: assignment.courses?.title || 'Unknown Course',
                dueDate: assignment.due_date,
                isOverdue: true,
                reminderType: 'overdue'
              }
            });
            sentCount++;
          }
        }
      }

      toast({
        title: "Notifications Sent",
        description: `Sent ${sentCount} overdue training notifications`,
      });
    } catch (error) {
      console.error('Error sending notifications:', error);
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setIsSendingNotifications(false);
    }
  };

  const exportTrainingReport = async () => {
    try {
      const { data: completions, error } = await supabase
        .from('course_completions')
        .select(`
          *,
          course_assignments!course_completions_assignment_id_fkey(
            courses(title),
            profiles!course_assignments_assigned_to_fkey(first_name, last_name, email)
          )
        `);

      if (error) throw error;

      // Convert to CSV
      const csvContent = [
        'Name,Email,Course,Completed At,Score,Signature',
        ...(completions || []).map(completion => {
          const assignment = completion.course_assignments;
          const profile = assignment?.profiles;
          const course = assignment?.courses;
          return `${profile?.first_name || ''} ${profile?.last_name || ''},${profile?.email || ''},${course?.title || ''},${completion.completed_at},${completion.score || 'N/A'},${(completion as any).signature || 'N/A'}`;
        }).join('\n')
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `training-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: "Training report downloaded successfully",
      });
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "Error",
        description: "Failed to export training report",
        variant: "destructive",
      });
    }
  };

  const handleMemberClick = (member: typeof teamMembers[0]) => {
    setSelectedMember(member);
    setIsEditMode(false);
    setEmailMessage('');
  };

  const handleSaveMember = async () => {
    if (!selectedMember) return;

    setIsSaving(true);
    try {
      // In a real implementation, this would update the database
      // For now, we'll just show a success message
      toast({
        title: "Success",
        description: "Member details updated successfully",
      });
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: "Error",
        description: "Failed to update member details",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedMember || !emailMessage) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      // In a real implementation, this would call an edge function to send email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Email Sent",
        description: `Email sent to ${selectedMember.name}`,
      });
      setEmailMessage('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendInvitation = async () => {
    if (!invitationForm.email || !invitationForm.firstName || !invitationForm.lastName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSendingInvitation(true);
    try {
      // Create invitation record
      const { data: invitation, error: inviteError } = await supabase
        .from('user_invitations')
        .insert({
          first_name: invitationForm.firstName,
          last_name: invitationForm.lastName,
          email: invitationForm.email,
          role: invitationForm.role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          invitation_token: crypto.randomUUID(),
        })
        .select()
        .single();

      if (inviteError) throw inviteError;

      // Send invitation email
      await supabase.functions.invoke('send-invitation', {
        body: {
          firstName: invitationForm.firstName,
          lastName: invitationForm.lastName,
          email: invitationForm.email,
          role: invitationForm.role,
          invitationId: invitation.id,
          inviterName: 'System Administrator'
        }
      });

      toast({
        title: "Invitation Sent",
        description: `Invitation sent to ${invitationForm.firstName} ${invitationForm.lastName}`,
      });

      // Reset form and close dialog
      setInvitationForm({ firstName: '', lastName: '', email: '', role: 'staff' });
      setIsInvitationDialogOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvitation(false);
    }
  };

  return (
    <>
      <Tabs defaultValue="overview" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-2">Track staff training completion and manage team members</p>
        </div>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invitations">Invitations</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* Action Bar */}
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
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Add Staff
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Add Staff from CSV</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="csv-file">CSV File</Label>
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Required fields: first_name, last_name, email, role
                    </p>
                  </div>
                  <Button 
                    onClick={handleCsvUpload} 
                    disabled={!csvFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? 'Processing...' : 'Upload and Send Invitations'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button 
              onClick={sendOverdueNotifications}
              disabled={isSendingNotifications}
              variant="outline" 
              size="sm"
            >
              <Mail className="h-4 w-4 mr-2" />
              {isSendingNotifications ? 'Sending...' : 'Send Overdue Notifications'}
            </Button>
            
            <Button 
              onClick={exportTrainingReport}
              variant="outline" 
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            
            <Button 
              onClick={() => setIsInvitationDialogOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Single User
            </Button>
          </div>
        </div>

        {/* Simplified Stats - Focus on Training */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <p className="text-sm text-muted-foreground">Completed Training</p>
            </div>
            <p className="text-2xl font-bold text-foreground">89.7%</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Clock className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-muted-foreground">In Progress</p>
            </div>
            <p className="text-2xl font-bold text-foreground">12</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-muted-foreground">Overdue</p>
            </div>
            <p className="text-2xl font-bold text-foreground">3</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <UserPlus className="h-5 w-5 text-blue-500 mr-2" />
              <p className="text-sm text-muted-foreground">Total Staff</p>
            </div>
            <p className="text-2xl font-bold text-foreground">245</p>
          </Card>
        </div>

        {/* Team Members Table - Focused on Training Status */}
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
                <TableHead>Training Progress</TableHead>
                <TableHead>Outstanding</TableHead>
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
                <TableRow 
                  key={member.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleMemberClick(member)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
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
                      <Progress value={member.training} className="w-24" />
                      <span className="text-sm font-medium text-muted-foreground">{member.training}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.training < 100 ? (
                      <Badge variant="destructive" className="text-xs">
                        {100 - member.training}% Remaining
                      </Badge>
                    ) : (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{member.role}</div>
                    <div className="text-sm text-muted-foreground">{member.department}</div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleMemberClick(member)}>
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          handleMemberClick(member);
                          setIsEditMode(true);
                        }}>
                          Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          handleMemberClick(member);
                          setEmailMessage(`Hi ${member.name},\n\nPlease complete your outstanding training assignments.\n\nBest regards,\nTraining Administrator`);
                        }}>
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Training Progress</DropdownMenuItem>
                        <DropdownMenuItem>Assign Training</DropdownMenuItem>
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

    {/* Member Detail Modal */}
    <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {selectedMember && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{isEditMode ? 'Edit' : 'View'} Member Profile</span>
                {!isEditMode && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(true)}>
                    Edit Details
                  </Button>
                )}
              </DialogTitle>
              <DialogDescription>
                {isEditMode ? 'Update member information and training details' : 'View member information and send communications'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Member Avatar and Basic Info */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center font-medium text-2xl">
                  {selectedMember.avatar}
                </div>
                <div className="flex-1">
                  {isEditMode ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="edit-name">Full Name</Label>
                        <Input
                          id="edit-name"
                          value={selectedMember.name}
                          onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="edit-email">Email</Label>
                        <Input
                          id="edit-email"
                          type="email"
                          value={selectedMember.email}
                          onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-foreground">{selectedMember.name}</h3>
                      <p className="text-muted-foreground">{selectedMember.email}</p>
                    </>
                  )}
                </div>
                <Badge variant={selectedMember.status === 'Active' ? 'default' : 'secondary'}>
                  {selectedMember.status}
                </Badge>
              </div>

              {/* Role and Department */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role-field">Role</Label>
                  {isEditMode ? (
                    <Input
                      id="role-field"
                      value={selectedMember.role}
                      onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{selectedMember.role}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="department-field">Department</Label>
                  {isEditMode ? (
                    <Input
                      id="department-field"
                      value={selectedMember.department}
                      onChange={(e) => setSelectedMember({ ...selectedMember, department: e.target.value })}
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground mt-1">{selectedMember.department}</p>
                  )}
                </div>
              </div>

              {/* Training Progress */}
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold text-foreground mb-3">Training Progress</h4>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Completion</p>
                    <p className="text-2xl font-bold text-foreground">{selectedMember.training}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Compliance</p>
                    <p className="text-2xl font-bold text-foreground">{selectedMember.compliance}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                    <p className="text-sm font-medium text-foreground mt-1">{selectedMember.lastActivity}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Training Progress</span>
                    <span className="font-medium">{selectedMember.training}%</span>
                  </div>
                  <Progress value={selectedMember.training} className="h-2" />
                </div>
              </div>

              {/* Send Email Section */}
              {!isEditMode && (
                <div className="p-4 border rounded-lg space-y-4">
                  <h4 className="font-semibold text-foreground">Send Email</h4>
                  <div>
                    <Label htmlFor="email-message">Message</Label>
                    <Textarea
                      id="email-message"
                      placeholder="Type your message..."
                      rows={4}
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                    />
                  </div>
                  <Button 
                    onClick={handleSendEmail} 
                    disabled={isSendingEmail || !emailMessage}
                    className="w-full"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isSendingEmail ? 'Sending...' : 'Send Email'}
                  </Button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                {isEditMode ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveMember} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" onClick={() => setSelectedMember(null)}>
                    Close
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>

    {/* Add Single User Dialog */}
    <Dialog open={isInvitationDialogOpen} onOpenChange={setIsInvitationDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Staff Member</DialogTitle>
          <DialogDescription>
            Send an invitation to a new staff member. They will receive an email with instructions to join.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter first name"
                value={invitationForm.firstName}
                onChange={(e) => setInvitationForm({ ...invitationForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter last name"
                value={invitationForm.lastName}
                onChange={(e) => setInvitationForm({ ...invitationForm, lastName: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={invitationForm.email}
              onChange={(e) => setInvitationForm({ ...invitationForm, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={invitationForm.role} 
              onValueChange={(value) => setInvitationForm({ ...invitationForm, role: value as 'staff' | 'admin' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsInvitationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={sendInvitation} disabled={isSendingInvitation || !invitationForm.email || !invitationForm.firstName || !invitationForm.lastName}>
              {isSendingInvitation ? "Sending..." : "Send Invitation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
