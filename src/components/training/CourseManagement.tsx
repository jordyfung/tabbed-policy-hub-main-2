import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, BookOpen, Clock, Users, Star, Upload, Play, Settings, Bell, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import ScormUpload from './ScormUpload';
import ScormPlayer from './ScormPlayer';

interface Course {
  id: string;
  title: string;
  description: string;
  content: string;
  duration_hours: number;
  is_mandatory: boolean;
  created_at: string;
  created_by: string;
  course_type: 'manual' | 'scorm';
  scorm_package_path: string | null;
  scorm_manifest_data: any;
  scorm_entry_point: string | null;
}

interface CourseFrequency {
  id: string;
  course_id: string;
  frequency_months: number;
  role: 'admin' | 'staff' | null;
  email_notifications_enabled?: boolean;
  created_at: string;
  courses?: { title: string };
}

export default function CourseManagement() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [frequencies, setFrequencies] = useState<CourseFrequency[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showScormUpload, setShowScormUpload] = useState(false);
  const [playingCourse, setPlayingCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState('courses');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_hours: 1,
    is_mandatory: false
  });
  const [frequencyFormData, setFrequencyFormData] = useState({
    course_id: '',
    frequency_months: 12,
    role: 'staff' as 'admin' | 'staff' | null,
    email_notifications_enabled: true
  });

  useEffect(() => {
    fetchCourses();
    fetchFrequencies();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses((data || []) as Course[]);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFrequencies = async () => {
    try {
      const { data, error } = await supabase
        .from('course_frequencies')
        .select(`
          *,
          courses(title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFrequencies((data || []) as CourseFrequency[]);
    } catch (error) {
      console.error('Error fetching frequencies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch course frequencies",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !profile?.user_id) return;

    setSaving(true);
    try {
      if (editingCourse) {
        // Update existing course
        const { error } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            duration_hours: formData.duration_hours,
            is_mandatory: formData.is_mandatory
          })
          .eq('id', editingCourse.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Course updated successfully",
        });
      } else {
        // Create new course
        const { error } = await supabase
          .from('courses')
          .insert({
            title: formData.title,
            description: formData.description,
            content: formData.content,
            duration_hours: formData.duration_hours,
            is_mandatory: formData.is_mandatory,
            created_by: profile.user_id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Course created successfully",
        });
      }

      resetForm();
      setIsDialogOpen(false);
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteCourse = async (id: string) => {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course deleted successfully",
      });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: "Error",
        description: "Failed to delete course",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description || '',
      content: course.content || '',
      duration_hours: course.duration_hours || 1,
      is_mandatory: course.is_mandatory || false
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      duration_hours: 1,
      is_mandatory: false
    });
    setEditingCourse(null);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleFrequencySubmit = async () => {
    if (!frequencyFormData.course_id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('course_frequencies')
        .insert({
          course_id: frequencyFormData.course_id,
          frequency_months: frequencyFormData.frequency_months,
          role: frequencyFormData.role,
          email_notifications_enabled: frequencyFormData.email_notifications_enabled
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Course frequency settings saved successfully",
      });

      setFrequencyFormData({
        course_id: '',
        frequency_months: 12,
        role: 'staff',
        email_notifications_enabled: true
      });
      fetchFrequencies();
    } catch (error) {
      console.error('Error saving frequency:', error);
      toast({
        title: "Error",
        description: "Failed to save frequency settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateFrequency = async (id: string, updates: Partial<CourseFrequency>) => {
    try {
      const { error } = await supabase
        .from('course_frequencies')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Frequency settings updated successfully",
      });
      fetchFrequencies();
    } catch (error) {
      console.error('Error updating frequency:', error);
      toast({
        title: "Error",
        description: "Failed to update frequency settings",
        variant: "destructive",
      });
    }
  };

  const deleteFrequency = async (id: string) => {
    try {
      const { error } = await supabase
        .from('course_frequencies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Frequency settings deleted successfully",
      });
      fetchFrequencies();
    } catch (error) {
      console.error('Error deleting frequency:', error);
      toast({
        title: "Error",
        description: "Failed to delete frequency settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Management</h2>
          <p className="text-foreground/60">Create and manage training courses, set frequencies and notifications</p>
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                <DialogDescription>
                  {editingCourse ? 'Update the course details and content.' : 'Create a new training course with content and settings.'}
                </DialogDescription>
              </DialogHeader>
              {editingCourse?.course_type === 'scorm' && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Note:</strong> This is a SCORM course. Only basic metadata can be edited.
                    The course content is managed by the SCORM package.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter course title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief course description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                
                {(!editingCourse || editingCourse.course_type === 'manual') && (
                  <div>
                    <Label htmlFor="content">Course Content</Label>
                    <Textarea
                      id="content"
                      placeholder="Detailed course content and learning objectives"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="duration">Duration (Hours)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 1 })}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="mandatory"
                    checked={formData.is_mandatory}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_mandatory: checked })}
                  />
                  <Label htmlFor="mandatory">Mandatory Course</Label>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving || !formData.title}>
                    {saving ? "Saving..." : (editingCourse ? "Update Course" : "Create Course")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {isAdmin && (
            <Button onClick={() => setShowScormUpload(true)} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Upload SCORM Package
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 mr-2" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="frequencies">
            <Calendar className="h-4 w-4 mr-2" />
            Frequencies & Notifications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No courses created</h3>
            <p className="text-foreground/60">Create your first course to get started</p>
          </div>
        ) : (
          courses.map((course) => (
            <Card key={course.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground line-clamp-2">{course.title}</h3>
                      <Badge variant={course.course_type === 'scorm' ? 'default' : 'secondary'} className="shrink-0">
                        {course.course_type === 'scorm' ? 'SCORM' : 'Manual'}
                      </Badge>
                    </div>
                    {course.description && (
                      <p className="text-sm text-foreground/60 line-clamp-3">{course.description}</p>
                    )}
                  </div>
                  {course.is_mandatory && (
                    <Badge className="bg-critical text-white shrink-0">
                      <Star className="w-3 h-3 mr-1" />
                      Mandatory
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-foreground/60">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration_hours}h
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Course
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  {course.course_type === 'scorm' && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setPlayingCourse(course)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Launch
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(course)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCourse(course.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
        </div>
        </TabsContent>

        <TabsContent value="frequencies" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Training Frequencies</h3>
              <p className="text-sm text-muted-foreground">Set how often staff need to complete each course</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Frequency Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Course Frequency</DialogTitle>
                  <DialogDescription>
                    Set how often this course needs to be completed and notification preferences.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="frequency-course">Course</Label>
                    <Select 
                      value={frequencyFormData.course_id} 
                      onValueChange={(value) => setFrequencyFormData({ ...frequencyFormData, course_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency-months">Frequency (Months)</Label>
                    <Select 
                      value={frequencyFormData.frequency_months.toString()} 
                      onValueChange={(value) => setFrequencyFormData({ ...frequencyFormData, frequency_months: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">12 Months (Annual)</SelectItem>
                        <SelectItem value="24">24 Months</SelectItem>
                        <SelectItem value="36">36 Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="frequency-role">Apply to Role</Label>
                    <Select 
                      value={frequencyFormData.role || 'all'} 
                      onValueChange={(value) => setFrequencyFormData({ ...frequencyFormData, role: value === 'all' ? null : value as 'admin' | 'staff' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="staff">Staff Only</SelectItem>
                        <SelectItem value="admin">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-notifications"
                      checked={frequencyFormData.email_notifications_enabled}
                      onCheckedChange={(checked) => setFrequencyFormData({ ...frequencyFormData, email_notifications_enabled: checked })}
                    />
                    <Label htmlFor="email-notifications">Enable Email Notifications</Label>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setFrequencyFormData({
                      course_id: '',
                      frequency_months: 12,
                      role: 'staff',
                      email_notifications_enabled: true
                    })}>
                      Cancel
                    </Button>
                    <Button onClick={handleFrequencySubmit} disabled={saving || !frequencyFormData.course_id}>
                      {saving ? "Saving..." : "Save Frequency"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {frequencies.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Calendar className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No frequency rules set</h3>
                <p className="text-foreground/60">Add frequency rules to automate training schedules</p>
              </div>
            ) : (
              frequencies.map((frequency) => (
                <Card key={frequency.id} className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-foreground">{(frequency as any).courses?.title || 'Unknown Course'}</h4>
                        <p className="text-sm text-muted-foreground">
                          Every {frequency.frequency_months} month{frequency.frequency_months !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <Badge variant={frequency.email_notifications_enabled ? 'default' : 'secondary'}>
                        <Bell className="w-3 h-3 mr-1" />
                        {frequency.email_notifications_enabled ? 'Notifications On' : 'Notifications Off'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Role:</span>
                        <span>{frequency.role || 'All Roles'}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateFrequency(frequency.id, { 
                          email_notifications_enabled: !frequency.email_notifications_enabled 
                        })}
                      >
                        <Bell className="w-4 h-4 mr-1" />
                        Toggle Notifications
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFrequency(frequency.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* SCORM Upload Dialog */}
      <Dialog open={showScormUpload} onOpenChange={setShowScormUpload}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload SCORM Package</DialogTitle>
            <DialogDescription>
              Upload a SCORM package to create an interactive training course. The package will be processed and made available for training.
            </DialogDescription>
          </DialogHeader>
          <ScormUpload
            onUploadComplete={(courseId) => {
              setShowScormUpload(false);
              fetchCourses(); // Refresh course list
              toast({
                title: "Success",
                description: "SCORM package uploaded successfully!",
              });
            }}
            onCancel={() => setShowScormUpload(false)}
          />
        </DialogContent>
      </Dialog>

      {/* SCORM Player Dialog */}
      {playingCourse && (
        <Dialog 
          open={!!playingCourse} 
          onOpenChange={(isOpen) => !isOpen && setPlayingCourse(null)}
        >
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle>{playingCourse.title}</DialogTitle>
              <DialogDescription>
                SCORM 1.2 Course Player
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow">
              <ScormPlayer
                manifestUrl={`${import.meta.env.VITE_SUPABASE_URL || 'https://prpfrwqqsxqsikehzosd.supabase.co'}/functions/v1/scorm-proxy?path=${playingCourse.scorm_package_path}/${playingCourse.scorm_entry_point}`}
                scormCourseId={playingCourse.id}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}