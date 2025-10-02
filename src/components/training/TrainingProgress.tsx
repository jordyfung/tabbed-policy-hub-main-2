import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Clock, CheckCircle, Trophy, Star, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import CourseCompletionForm from './CourseCompletionForm';

interface Assignment {
  id: string;
  course_id: string;
  due_date: string;
  completion_count: number;
  course: {
    id: string;
    title: string;
    description: string;
    content: string;
    duration_hours: number;
    is_mandatory: boolean;
  };
}

interface Achievement {
  id: string;
  achievement_name: string;
  description: string;
  points: number;
  icon: string;
  earned_at: string;
}

interface TrainingStreak {
  current_streak: number;
  longest_streak: number;
  last_completion_date: string;
}

export default function TrainingProgress() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [streak, setStreak] = useState<TrainingStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (profile?.user_id) {
      fetchTrainingData();
    }
  }, [profile]);

  const fetchTrainingData = async () => {
    if (!profile?.user_id) return;

    try {
      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select(`
          *,
          course:courses(*)
        `)
        .eq('assigned_to', profile.user_id)
        .order('due_date', { ascending: true });

      if (assignmentsError) throw assignmentsError;

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', profile.user_id)
        .order('earned_at', { ascending: false });

      if (achievementsError) throw achievementsError;

      // Fetch training streak
      const { data: streakData, error: streakError } = await supabase
        .from('training_streaks')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (streakError && streakError.code !== 'PGRST116') throw streakError;

      setAssignments(assignmentsData || []);
      setAchievements(achievementsData || []);
      setStreak(streakData);
    } catch (error) {
      console.error('Error fetching training data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch training data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  const openCompletionDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  const calculateProgress = () => {
    if (assignments.length === 0) return 0;
    const completed = assignments.filter(a => a.completion_count > 0).length;
    return (completed / assignments.length) * 100;
  };

  const getTotalXP = () => {
    return achievements.reduce((total, achievement) => total + achievement.points, 0);
  };

  const getStatusBadge = (assignment: Assignment) => {
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    const isOverdue = dueDate < now;

    if (assignment.completion_count > 0) {
      return <Badge className="bg-success text-white"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  if (loading) {
    return <div className="animate-pulse">Loading training progress...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">My Training Progress</h2>
        <p className="text-foreground/60">Track your learning journey and achievements</p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="w-8 h-8 text-info" />
            <div>
              <h3 className="font-semibold text-foreground">Overall Progress</h3>
              <p className="text-2xl font-bold text-foreground">{Math.round(calculateProgress())}%</p>
            </div>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
          <p className="text-sm text-foreground/60 mt-2">
            {assignments.filter(a => a.completion_count > 0).length} of {assignments.length} courses completed
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Trophy className="w-8 h-8 text-warning" />
            <div>
              <h3 className="font-semibold text-foreground">Total XP</h3>
              <p className="text-2xl font-bold text-foreground">{getTotalXP()}</p>
            </div>
          </div>
          <p className="text-sm text-foreground/60">
            {achievements.length} achievements earned
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Star className="w-8 h-8 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Training Streak</h3>
              <p className="text-2xl font-bold text-foreground">{streak?.current_streak || 0}</p>
            </div>
          </div>
          <p className="text-sm text-foreground/60">
            Best: {streak?.longest_streak || 0} days
          </p>
        </Card>
      </div>

      {/* My Courses */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">My Assigned Courses</h3>
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No courses assigned</h4>
              <p className="text-foreground/60">Check back later for new training assignments</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="font-medium text-foreground">{assignment.course.title}</h4>
                    {assignment.course.is_mandatory && (
                      <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground/60 line-clamp-2">
                    {assignment.course.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-foreground/60">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {assignment.course.duration_hours}h
                    </div>
                    <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                    {assignment.completion_count > 0 && (
                      <span className="text-success">✓ Completed {assignment.completion_count} time(s)</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(assignment)}
                  {assignment.completion_count === 0 && (
                    <Button
                      onClick={() => openCompletionDialog(assignment)}
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                    >
                      Start Course
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.slice(0, 6).map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <Trophy className="w-8 h-8 text-warning" />
                <div>
                  <h4 className="font-medium text-foreground text-sm">{achievement.achievement_name}</h4>
                  <p className="text-xs text-foreground/60">{achievement.description}</p>
                  <p className="text-xs text-info font-medium">{achievement.points} XP</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Course Completion Dialog with Digital Signature */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete Course: {selectedAssignment?.course.title}</DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <CourseCompletionForm
              assignmentId={selectedAssignment.id}
              courseTitle={selectedAssignment.course.title}
              onCompletion={() => {
                setIsDialogOpen(false);
                setSelectedAssignment(null);
                setCompletionNotes('');
                fetchTrainingData();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}