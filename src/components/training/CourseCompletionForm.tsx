import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, FileText, Clock, User } from 'lucide-react';

interface CourseCompletionFormProps {
  assignmentId: string;
  courseTitle: string;
  onCompletion?: () => void;
}

export default function CourseCompletionForm({ 
  assignmentId, 
  courseTitle, 
  onCompletion 
}: CourseCompletionFormProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    score: '',
    comments: '',
    signature: '',
    acknowledgeCompletion: false,
    acknowledgeAccuracy: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acknowledgeCompletion || !formData.acknowledgeAccuracy) {
      toast({
        title: "Required Acknowledgments",
        description: "Please acknowledge both statements to complete the course.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.signature.trim()) {
      toast({
        title: "Digital Signature Required",
        description: "Please provide your digital signature to complete the course.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('course_completions')
        .insert({
          assignment_id: assignmentId,
          completed_by: profile?.user_id,
          completed_at: new Date().toISOString(),
          score: formData.score ? parseFloat(formData.score) : null,
          notes: formData.comments || null,
          signature: formData.signature.trim()
        });

      if (error) throw error;

      toast({
        title: "Course Completed Successfully",
        description: "Your completion has been recorded with your digital signature.",
      });

      // Reset form
      setFormData({
        score: '',
        comments: '',
        signature: '',
        acknowledgeCompletion: false,
        acknowledgeAccuracy: false
      });

      onCompletion?.();
    } catch (error) {
      console.error('Error completing course:', error);
      toast({
        title: "Error",
        description: "Failed to record course completion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Course Completion</h2>
          <p className="text-muted-foreground">Complete your training for: <strong>{courseTitle}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Score Input */}
          <div>
            <Label htmlFor="score">Score (Optional)</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="100"
              placeholder="Enter your score (0-100)"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
            />
            <p className="text-sm text-muted-foreground mt-1">
              If you received a score, enter it here. Leave blank if not applicable.
            </p>
          </div>

          {/* Comments */}
          <div>
            <Label htmlFor="comments">Comments (Optional)</Label>
            <Textarea
              id="comments"
              placeholder="Share any feedback or comments about the course..."
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              rows={3}
            />
          </div>

          {/* Digital Signature */}
          <div>
            <Label htmlFor="signature">Digital Signature *</Label>
            <Input
              id="signature"
              placeholder="Type your full name as your digital signature"
              value={formData.signature}
              onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              By typing your name, you are providing a digital signature acknowledging course completion.
            </p>
          </div>

          {/* Acknowledgments */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-foreground">Required Acknowledgments</h3>
            
            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge-completion"
                checked={formData.acknowledgeCompletion}
                onCheckedChange={(checked) => setFormData({ ...formData, acknowledgeCompletion: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="acknowledge-completion" className="text-sm">
                  I acknowledge that I have completed the training course "{courseTitle}" in its entirety.
                </Label>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="acknowledge-accuracy"
                checked={formData.acknowledgeAccuracy}
                onCheckedChange={(checked) => setFormData({ ...formData, acknowledgeAccuracy: !!checked })}
              />
              <div className="space-y-1">
                <Label htmlFor="acknowledge-accuracy" className="text-sm">
                  I certify that the information provided is accurate and that I understand the material covered.
                </Label>
              </div>
            </div>
          </div>

          {/* Completion Info */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              Completed: {new Date().toLocaleDateString()}
            </div>
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {profile?.first_name} {profile?.last_name}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.acknowledgeCompletion || !formData.acknowledgeAccuracy || !formData.signature.trim()}
          >
            {isSubmitting ? 'Recording Completion...' : 'Complete Course'}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <p>This completion will be recorded with your digital signature and stored for audit purposes.</p>
        </div>
      </div>
    </Card>
  );
}
