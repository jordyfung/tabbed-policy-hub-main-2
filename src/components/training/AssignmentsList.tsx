import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Play, 
  MoreHorizontal, 
  Eye, 
  FileText, 
  AlertTriangle, 
  Clock,
  BookOpen,
  CheckCircle2
} from 'lucide-react';
import { AssignmentGroup, Assignment } from '@/integrations/supabase/types';

interface AssignmentsListProps {
  groups: AssignmentGroup[];
  onStart: (assignmentId: string) => void;
  onResume: (assignmentId: string) => void;
  onViewDetails: (assignmentId: string) => void;
  onViewSyllabus: (assignmentId: string) => void;
  onReportIssue: (assignmentId: string) => void;
  onMarkDone: (assignmentId: string) => void;
  allowManualCompletion?: boolean;
}

export default function AssignmentsList({ 
  groups, 
  onStart, 
  onResume, 
  onViewDetails, 
  onViewSyllabus, 
  onReportIssue, 
  onMarkDone,
  allowManualCompletion = false
}: AssignmentsListProps) {
  const { t } = useTranslation();
  const [confirmMarkDone, setConfirmMarkDone] = useState<string | null>(null);

  const getStatusBadge = (assignment: Assignment) => {
    if (assignment.status === 'completed') {
      return (
        <Badge variant="secondary" className="bg-success/10 text-success">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          {t('trainingProfile.badges.completed')}
        </Badge>
      );
    }
    
    if (assignment.status === 'overdue') {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertTriangle className="h-3 w-3" />
          <span>{t('trainingProfile.badges.overdue')}</span>
        </Badge>
      );
    }
    
    if (assignment.dueDate) {
      const dueDate = new Date(assignment.dueDate);
      const now = new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue <= 7 && daysUntilDue > 0) {
        return (
          <Badge variant="secondary" className="bg-warning/10 text-warning">
            {t('trainingProfile.badges.dueSoon')}
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="outline">
        {t('trainingProfile.badges.pending')}
      </Badge>
    );
  };

  const getPrimaryAction = (assignment: Assignment) => {
    const isInProgress = assignment.status === 'in_progress';
    const hasProgress = assignment.progressPercent > 0;
    
    if (isInProgress || hasProgress) {
      return {
        text: t('trainingRedesign.actions.resume'),
        onClick: () => onResume(assignment.id),
        icon: <Play className="h-4 w-4 mr-2" />
      };
    }
    
    return {
      text: t('trainingRedesign.actions.start'),
      onClick: () => onStart(assignment.id),
      icon: <Play className="h-4 w-4 mr-2" />
    };
  };

  const handleMarkDone = (assignmentId: string) => {
    setConfirmMarkDone(assignmentId);
  };

  const confirmMarkDoneAction = () => {
    if (confirmMarkDone) {
      onMarkDone(confirmMarkDone);
      setConfirmMarkDone(null);
    }
  };

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <Card key={group.title} className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {group.title}
          </h3>
          
          {group.assignments.length === 0 ? (
            <div className="text-center py-8 text-foreground/60">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-foreground/30" />
              <p>{group.emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {group.assignments.map((assignment) => {
                const primaryAction = getPrimaryAction(assignment);
                
                return (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-foreground">{assignment.title}</h4>
                          {assignment.isMandatory && (
                            <Badge variant="outline" className="bg-critical/10 text-critical">
                              {t('trainingProfile.badges.mandatory')}
                            </Badge>
                          )}
                        </div>
                        
                        {assignment.progressPercent > 0 && assignment.status !== 'completed' && (
                          <div className="mb-2">
                            <div className="flex justify-between text-sm text-foreground/60 mb-1">
                              <span>Progress</span>
                              <span>{assignment.progressPercent}%</span>
                            </div>
                            <Progress value={assignment.progressPercent} className="h-2" />
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-foreground/60">
                          {assignment.dueDate && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {t('trainingProfile.labels.due')}: {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                          {assignment.estimatedMinutes && (
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>~{assignment.estimatedMinutes} min</span>
                            </div>
                          )}
                        </div>
                        
                        {assignment.standards && assignment.standards.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {assignment.standards.map((standard, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {standard}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(assignment)}
                      
                      <Button
                        onClick={primaryAction.onClick}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        {primaryAction.icon}
                        {primaryAction.text}
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewDetails(assignment.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('trainingRedesign.actions.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewSyllabus(assignment.id)}>
                            <FileText className="h-4 w-4 mr-2" />
                            {t('trainingRedesign.actions.viewSyllabus')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onReportIssue(assignment.id)}>
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            {t('trainingRedesign.actions.reportIssue')}
                          </DropdownMenuItem>
                          {allowManualCompletion && assignment.status !== 'completed' && (
                            <DropdownMenuItem onClick={() => handleMarkDone(assignment.id)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              {t('trainingRedesign.actions.markDone')}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      ))}
      
      {/* Mark as Done Confirmation Dialog */}
      <Dialog open={!!confirmMarkDone} onOpenChange={() => setConfirmMarkDone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('trainingRedesign.actions.confirmMarkDoneTitle')}</DialogTitle>
          </DialogHeader>
          <p className="text-foreground/60 mb-4">
            {t('trainingRedesign.actions.confirmMarkDone')}
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmMarkDone(null)}>
              Cancel
            </Button>
            <Button onClick={confirmMarkDoneAction}>
              {t('trainingRedesign.actions.markDone')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
