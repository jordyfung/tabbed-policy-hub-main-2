import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shield, Users, Heart, Building, Utensils, Pill, AlertTriangle, UserCheck } from 'lucide-react';

const qualityStandards = [
  {
    id: 1,
    name: 'Governance and Management',
    description: 'Leadership, planning, continuous improvement',
    score: 94,
    status: 'compliant',
    icon: Shield,
    color: 'governance',
    policies: 12,
    lastAudit: '2024-01-15'
  },
  {
    id: 2,
    name: 'Care and Services',
    description: 'Assessment, planning, delivery, review',
    score: 89,
    status: 'compliant',
    icon: Heart,
    color: 'clinical',
    policies: 18,
    lastAudit: '2024-01-10'
  },
  {
    id: 3,
    name: 'Personal and Clinical Care',
    description: 'Evidence-based care and support',
    score: 92,
    status: 'compliant',
    icon: UserCheck,
    color: 'personal',
    policies: 24,
    lastAudit: '2024-01-08'
  },
  {
    id: 4,
    name: 'Services and Supports',
    description: 'Daily living, community access',
    score: 87,
    status: 'attention',
    icon: Users,
    color: 'clinical',
    policies: 15,
    lastAudit: '2024-01-12'
  },
  {
    id: 5,
    name: 'Organisation\'s Service Environment',
    description: 'Physical environment, equipment',
    score: 96,
    status: 'compliant',
    icon: Building,
    color: 'environment',
    policies: 9,
    lastAudit: '2024-01-20'
  },
  {
    id: 6,
    name: 'Feedback and Complaints',
    description: 'Consumer feedback systems',
    score: 91,
    status: 'compliant',
    icon: AlertTriangle,
    color: 'incidents',
    policies: 6,
    lastAudit: '2024-01-18'
  },
  {
    id: 7,
    name: 'Human Resources',
    description: 'Workforce planning, development',
    score: 85,
    status: 'attention',
    icon: Users,
    color: 'workforce',
    policies: 21,
    lastAudit: '2024-01-14'
  },
  {
    id: 8,
    name: 'Organisational Governance',
    description: 'Corporate governance, risk management',
    score: 93,
    status: 'compliant',
    icon: Shield,
    color: 'governance',
    policies: 16,
    lastAudit: '2024-01-16'
  }
];

export default function QualityStandardsContent() {
  const overallScore = Math.round(qualityStandards.reduce((acc, std) => acc + std.score, 0) / qualityStandards.length);
  const compliantCount = qualityStandards.filter(std => std.status === 'compliant').length;
  const attentionCount = qualityStandards.filter(std => std.status === 'attention').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Quality Standards Compliance</h1>
        <p className="text-foreground/60 mt-2">Monitor compliance against the Strengthened Quality Standards</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{overallScore}%</h3>
          <p className="text-foreground/60">Overall Compliance</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{compliantCount}</h3>
          <p className="text-foreground/60">Standards Met</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{attentionCount}</h3>
          <p className="text-foreground/60">Need Attention</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Strengthened Quality Standards</h3>
        <div className="grid gap-4">
          {qualityStandards.map((standard) => {
            const Icon = standard.icon;
            const statusColor = standard.status === 'compliant' ? 'success' : 'warning';
            
            return (
              <div key={standard.id} className="p-4 border border-border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      standard.status === 'compliant' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">Standard {standard.id}: {standard.name}</h4>
                      <p className="text-sm text-foreground/60">{standard.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    standard.status === 'compliant' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                  }`}>
                    {standard.status === 'compliant' ? 'Compliant' : 'Needs Attention'}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-foreground/60">Compliance Score</span>
                    <span className="font-medium text-foreground">{standard.score}%</span>
                  </div>
                  <Progress value={standard.score} className="h-2" />
                  
                  <div className="flex items-center justify-between text-xs text-foreground/60 pt-2">
                    <span>{standard.policies} active policies</span>
                    <span>Last audit: {standard.lastAudit}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}