import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, CheckCircle, Clock } from 'lucide-react';

interface FeedbackItem {
  id: number;
  created_at: string;
  feedback_text: string;
  status: string;
  response_text?: string;
  closed_at?: string;
  closed_by?: string;
}

export default function AssuranceContent() {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseTexts, setResponseTexts] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      // Use direct SQL query since the table doesn't exist in types yet
      const { data, error } = await supabase
        .from('feedback_complaints' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        // Set empty array on error to show "no feedback" state
        setFeedback([]);
      } else {
        setFeedback((data as unknown as FeedbackItem[]) || []);
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      // Set empty array on error to show "no feedback" state
      setFeedback([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (id: number, value: string) => {
    setResponseTexts(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmitResponse = async (id: number) => {
    const responseText = responseTexts[id];
    if (!responseText?.trim() || !profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('feedback_complaints' as any)
        .update({
          response_text: responseText,
          status: 'closed',
          closed_at: new Date().toISOString(),
          closed_by: profile.user_id
        })
        .eq('id', id);

      if (error) throw error;

      // Refresh the data
      await fetchFeedback();
      setResponseTexts(prev => ({ ...prev, [id]: '' }));
    } catch (error) {
      console.error('Error updating feedback:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback & Complaints</h1>
          <p className="text-foreground/60 mt-2">Loading feedback...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback & Complaints</h1>
        <p className="text-foreground/60 mt-2">Manage feedback and complaints submitted from external forms</p>
      </div>

      {feedback.length === 0 ? (
        <Card className="p-8 text-center">
          <MessageSquare className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No feedback yet</h3>
          <p className="text-foreground/60">Feedback submitted from external forms will appear here.</p>
        </Card>
      ) : (
        <Card className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Response</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedback.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm text-foreground/60">
                    {formatDate(item.created_at)}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="text-sm text-foreground">
                      {item.feedback_text}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={item.status === 'closed' ? 'default' : 'secondary'}
                      className={
                        item.status === 'closed' 
                          ? 'bg-success/20 text-success' 
                          : 'bg-warning/20 text-warning'
                      }
                    >
                      {item.status === 'closed' ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Closed
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 mr-1" />
                          Open
                        </>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-md">
                    {item.response_text ? (
                      <div className="text-sm text-foreground">
                        {item.response_text}
                        {item.closed_at && (
                          <div className="text-xs text-foreground/60 mt-1">
                            Closed: {formatDate(item.closed_at)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-foreground/60">No response yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.status === 'open' && (isAdmin || isSuperAdmin) && (
                      <div className="space-y-2">
                        <Textarea
                          placeholder="Enter your response..."
                          value={responseTexts[item.id] || ''}
                          onChange={(e) => handleResponseChange(item.id, e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSubmitResponse(item.id)}
                          disabled={!responseTexts[item.id]?.trim()}
                        >
                          Submit Response & Close
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}