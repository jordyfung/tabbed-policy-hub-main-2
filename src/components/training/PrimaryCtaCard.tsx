import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { NextUpAssignment } from '@/integrations/supabase/types';

interface PrimaryCtaCardProps {
  nextUp: NextUpAssignment;
  onStart: (assignmentId: string) => void;
  onResume: (assignmentId: string) => void;
}

export default function PrimaryCtaCard({ nextUp, onStart, onResume }: PrimaryCtaCardProps) {
  const { t } = useTranslation();

  if (!nextUp) {
    return (
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Play className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('trainingRedesign.primaryCta.noAssignments')}
          </h3>
          <p className="text-foreground/60">
            {t('trainingRedesign.emptyStates.noAssignmentsDesc')}
          </p>
        </div>
      </Card>
    );
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
      return t('trainingRedesign.primaryCta.resumeCourse', { courseName: nextUp.title });
    }
    return t('trainingRedesign.primaryCta.startCourse', { courseName: nextUp.title });
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
    <Card className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Play className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {t('trainingRedesign.primaryCta.continueTraining')}
            </h3>
            <p className="text-sm text-foreground/60">{nextUp.title}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {hasProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-foreground/60 mb-2">
            <span>Progress</span>
            <span>{nextUp.progressPercent}%</span>
          </div>
          <Progress value={nextUp.progressPercent} className="h-2" />
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm text-foreground/60">
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

        <Button 
          onClick={handleClick}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          <Play className="h-4 w-4 mr-2" />
          {getButtonText()}
        </Button>
      </div>
    </Card>
  );
}
