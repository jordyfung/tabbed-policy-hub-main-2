import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, AlertTriangle, Clock } from 'lucide-react';
import { ComplianceSummary as ComplianceSummaryType } from '@/integrations/supabase/types';

interface ComplianceSummaryProps {
  compliance: ComplianceSummaryType;
}

export default function ComplianceSummary({ compliance }: ComplianceSummaryProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-info/10 text-info">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">
                {t('trainingRedesign.compliance.mandatoryCoverage')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {t('trainingRedesign.compliance.coveragePercent', { 
                  percent: compliance.mandatoryCoverage 
                })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">
                {t('trainingRedesign.compliance.overdueCount')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {compliance.overdueCount}
              </p>
            </div>
          </div>
          {compliance.overdueCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {t('trainingRedesign.compliance.countItems', { count: compliance.overdueCount })}
            </Badge>
          )}
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-warning/10 text-warning">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground/60">
                {t('trainingRedesign.compliance.dueSoonCount')}
              </p>
              <p className="text-2xl font-bold text-foreground">
                {compliance.dueSoonCount}
              </p>
            </div>
          </div>
          {compliance.dueSoonCount > 0 && (
            <Badge variant="secondary" className="ml-2 bg-warning/10 text-warning">
              {t('trainingRedesign.compliance.countItems', { count: compliance.dueSoonCount })}
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
