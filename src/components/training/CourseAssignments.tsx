import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, UserPlus, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Course {
  id: string;
  title: string;
  duration_hours: number;
  is_mandatory: boolean;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Assignment {
  id: string;
  course_id: string;
  assigned_to: string;
  due_date: string;
  is_mandatory: boolean;
  completion_count: number;
  next_due_date: string;
  course: Course;
  assignee: Profile;
}

export default function CourseAssignments() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    Promise.all([
      fetchAssignments(),
      fetchCourses(),
      fetchProfiles()
    ]);
  }, []);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(id, title, duration_hours, is_mandatory),
          assignee:profiles!course_assignments_assigned_to_fkey(id, user_id, email, first_name, last_name, role)
        `)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch assignments",
        variant: "destructive",
      });
    }
  };

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, duration_hours, is_mandatory')
        .order('title');

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, first_name, last_name, role')
        .order('first_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAssignment = async () => {
    if (!selectedCourse || !selectedStaff || !profile?.user_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_assignments')
        .insert({
          course_id: selectedCourse,
          assigned_to: selectedStaff,
          assigned_by: profile.user_id,
          due_date: dueDate?.toISOString(),
          is_mandatory: courses.find(c => c.id === selectedCourse)?.is_mandatory || false
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course assigned successfully",
      });

      setSelectedCourse('');
      setSelectedStaff('');
      setDueDate(undefined);
      setIsDialogOpen(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to assign course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isOverdue = dueDate < now;
    const isDueSoon = dueDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (assignment.completion_count > 0) {
      return <Badge className="bg-success text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" />Overdue</Badge>;
    }
    if (isDueSoon) {
      return <Badge className="bg-warning text-white"><Clock className="w-3 h-3 mr-1" />Due Soon</Badge>;
    }
    return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (loading) {
    return <div className="animate-pulse">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Assignments</h2>
          <p className="text-foreground/60">Assign courses to staff members and track progress</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Course
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Course to Staff</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Course</label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title} {course.is_mandatory && '(Mandatory)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Select Staff Member</label>
                <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        {profile.first_name} {profile.last_name} ({profile.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Due Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Select due date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dueDate}
                      onSelect={setDueDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createAssignment} 
                  disabled={saving || !selectedCourse || !selectedStaff}
                >
                  {saving ? "Assigning..." : "Assign Course"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No assignments created</h3>
              <p className="text-foreground/60">Assign your first course to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-medium text-foreground">{assignment.course.title}</h4>
                      {assignment.course.is_mandatory && (
                        <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground/60">
                      Assigned to: {assignment.assignee.first_name} {assignment.assignee.last_name}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-foreground/60">
                      <span>Due: {format(new Date(assignment.due_date), "MMM d, yyyy")}</span>
                      <span>Duration: {assignment.course.duration_hours}h</span>
                      {assignment.completion_count > 0 && (
                        <span>Completed {assignment.completion_count} time(s)</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusBadge(assignment)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}