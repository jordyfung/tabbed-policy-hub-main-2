import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export default function FeedbackContent() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [policyName, setPolicyName] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyName.trim() || !feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill out all fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!profile) {
      toast({
        title: 'Error',
        description: 'You must be logged in to submit feedback.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('policy_feedback').insert({
        policy_name: policyName,
        feedback: feedback,
        submitted_by: `${profile.first_name} ${profile.last_name}`,
      });

      if (error) throw error;

      setPolicyName('');
      setFeedback('');
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! It has been sent to the quality team for review.',
      });
    } catch (error: any) {
      toast({
        title: 'Error submitting feedback',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Submit Policy Feedback</h1>
        <p className="text-foreground/60 mt-2">Suggest updates or report issues for any policy document.</p>
      </div>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Policy Feedback Form</CardTitle>
          <CardDescription>Your input helps us keep our policies accurate and up-to-date.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="policy-name">Policy Name or Number</Label>
              <Input
                id="policy-name"
                placeholder="e.g., 'Work Health and Safety' or 'POL-001'"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-text">Feedback / Suggested Change</Label>
              <Textarea
                id="feedback-text"
                placeholder="Please be as specific as possible. You can describe the issue, suggest new wording, or explain why a change is needed."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={8}
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
