import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Play, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { NextUpAssignment } from '@/integrations/supabase/types';

interface NextUpCardProps {
  nextUp: NextUpAssignment;
  onStart: (assignmentId: string) => void;
  onResume: (assignmentId: string) => void;
}

export default function NextUpCard({ nextUp, onStart, onResume }: NextUpCardProps) {
  const { t } = useTranslation();

  if (!nextUp) {
    return null;
  }

  const isOverdue = nextUp.status === 'overdue';
  const isInProgress = nextUp.status === 'in_progress';
  const hasProgress = nextUp.progressPercent > 0;

  const handleClick = () => {
    if (isInProgress || hasProgress) {
      onResume(nextUp.id);
    } else {
      onStart(nextUp.id);
    }
  };

  const getButtonText = () => {
    if (isInProgress || hasProgress) {
      return t('trainingRedesign.actions.resume');
    }
    return t('trainingRedesign.actions.start');
  };

  const getStatusBadge = () => {
    if (isOverdue) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{t('trainingProfile.badges.overdue')}</span>
        </Badge>
      );
    }
    if (nextUp.dueDate) {
      const dueDate = new Date(nextUp.dueDate);
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
    return null;
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t('trainingRedesign.nextUp.title')}
        </h3>
        {getStatusBadge()}
      </div>

      <div className="flex items-start space-x-4">
        <div className="p-3 rounded-lg bg-primary/10 text-primary">
          <BookOpen className="h-6 w-6" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-medium text-foreground mb-2">{nextUp.title}</h4>
          
          {nextUp.isMandatory && (
            <Badge variant="outline" className="bg-critical/10 text-critical mb-2">
              {t('trainingProfile.badges.mandatory')}
            </Badge>
          )}

          {hasProgress && (
            <div className="mb-3">
              <div className="flex justify-between text-sm text-foreground/60 mb-1">
                <span>Progress</span>
                <span>{nextUp.progressPercent}%</span>
              </div>
              <Progress value={nextUp.progressPercent} className="h-2" />
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-foreground/60 mb-4">
            {nextUp.dueDate && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {t('trainingRedesign.nextUp.dueDate', { 
                    date: new Date(nextUp.dueDate).toLocaleDateString() 
                  })}
                </span>
              </div>
            )}
            {nextUp.estimatedMinutes && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>
                  {t('trainingRedesign.nextUp.estimatedTime', { 
                    minutes: nextUp.estimatedMinutes 
                  })}
                </span>
              </div>
            )}
          </div>

          {nextUp.standards && nextUp.standards.length > 0 && (
            <div className="mb-4">
              <p className="text-sm text-foreground/60 mb-2">
                {t('trainingRedesign.nextUp.standards', { 
                  standards: nextUp.standards.join(', ') 
                })}
              </p>
            </div>
          )}

          <Button 
            onClick={handleClick}
            size="lg"
            className="bg-primary hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {getButtonText()}
          </Button>
        </div>
      </div>
    </Card>
  );
}
