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
import { Plus, Edit, Trash2, BookOpen, Clock, Users, Star, Upload, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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

export default function CourseManagement() {
  const { profile, isAdmin } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [showScormUpload, setShowScormUpload] = useState(false);
  const [playingCourse, setPlayingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    duration_hours: 1,
    is_mandatory: false
  });

  useEffect(() => {
    fetchCourses();
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

  if (loading) {
    return <div className="animate-pulse">Loading courses...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Course Management</h2>
          <p className="text-foreground/60">Create and manage training courses</p>
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

      {/* SCORM Upload Dialog */}
      <Dialog open={showScormUpload} onOpenChange={setShowScormUpload}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload SCORM Package</DialogTitle>
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
          onOpenChange={() => setPlayingCourse(null)}
        >
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-full h-full">
            <DialogHeader>
              <DialogTitle>
                <VisuallyHidden>SCORM Course Player</VisuallyHidden>
              </DialogTitle>
            </DialogHeader>
            <ScormPlayer
              manifestUrl={`/scorm_packages/${playingCourse.scorm_package_path}/${playingCourse.scorm_entry_point}`}
              scormCourseId={playingCourse.id}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}