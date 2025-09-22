import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Feedback {
  id: number;
  created_at: string;
  policy_name: string;
  feedback: string;
  submitted_by: string;
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
}

export default function ViewFeedbackContent() {
  const { isAdmin, viewMode } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      if (!isAdmin || viewMode !== 'admin') {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('policy_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
      } else if (data) {
        setFeedback(data as Feedback[]);
      }
      setLoading(false);
    };

    fetchFeedback();
  }, [isAdmin, viewMode]);

  const handleStatusChange = async (id: number, status: Feedback['status']) => {
    const { error } = await supabase
      .from('policy_feedback')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
    } else {
      setFeedback(feedback.map(item => item.id === id ? { ...item, status } : item));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin || viewMode !== 'admin') {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">View Policy Feedback</h1>
        <p className="text-foreground/60 mt-2">Review and manage feedback submitted by users.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Submitted Feedback</CardTitle>
          <CardDescription>All policy feedback submissions are listed below.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading feedback...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Feedback</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.policy_name}</TableCell>
                    <TableCell className="max-w-md whitespace-pre-wrap">{item.feedback}</TableCell>
                    <TableCell>{item.submitted_by}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Select value={item.status} onValueChange={(value) => handleStatusChange(item.id, value as Feedback['status'])}>
                        <SelectTrigger className={getStatusColor(item.status)}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
