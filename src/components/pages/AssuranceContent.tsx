import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Clock, TrendingUp, Shield, Users, Stethoscope, UserCheck, Building, Heart, CalendarClock, Activity } from 'lucide-react';

export default function AssuranceContent() {
  // Aged Care Specific Audits
  const audits = [
    {
      name: 'ACQSC Accreditation Assessment',
      status: 'Completed',
      score: 96,
      date: '2024-01-15',
      findings: 2,
      color: 'success',
      type: 'External'
    },
    {
      name: 'Clinical Governance Review',
      status: 'In Progress',
      score: null,
      date: '2024-01-25',
      findings: null,
      color: 'info',
      type: 'Internal'
    },
    {
      name: 'Quality Standards Assessment',
      status: 'Scheduled',
      score: null,
      date: '2024-02-10',
      findings: null,
      color: 'coral',
      type: 'External'
    },
    {
      name: 'Medication Management Audit',
      status: 'Completed',
      score: 89,
      date: '2024-01-08',
      findings: 4,
      color: 'success',
      type: 'Internal'
    }
  ];

  // Aged Care Specific Findings
  const findings = [
    {
      id: 'AC001',
      title: 'Care Plan Documentation Update',
      severity: 'Medium',
      status: 'Open',
      assignee: 'Clinical Team',
      standard: 'Standard 3'
    },
    {
      id: 'AC002',
      title: 'Incident Reporting Timeliness',
      severity: 'High',
      status: 'In Progress',
      assignee: 'Quality Team',
      standard: 'Standard 6'
    },
    {
      id: 'AC003',
      title: 'Staff Competency Verification',
      severity: 'Low',
      status: 'Resolved',
      assignee: 'HR Team',
      standard: 'Standard 7'
    },
    {
      id: 'AC004',
      title: 'Environment Safety Check',
      severity: 'Medium',
      status: 'Open',
      assignee: 'Facilities',
      standard: 'Standard 5'
    }
  ];

  // Aged Care Specific Metrics
  const careMetrics = [
    {
      name: 'Mandatory Care Minutes',
      value: '3.28',
      target: '3.50',
      unit: 'hours/day',
      status: 'attention',
      percentage: 94
    },
    {
      name: '24/7 RN Coverage',
      value: '98.5%',
      target: '100%',
      unit: '',
      status: 'good',
      percentage: 98.5
    },
    {
      name: 'Falls Prevention',
      value: '2.1',
      target: '<2.5',
      unit: 'per 1000 bed days',
      status: 'good',
      percentage: 84
    },
    {
      name: 'Medication Errors',
      value: '0.8',
      target: '<1.0',
      unit: 'per 1000 doses',
      status: 'good',
      percentage: 80
    }
  ];

  // PDCA Cycle Progress
  const pdcaCycles = [
    {
      title: 'Falls Reduction Initiative',
      phase: 'Act',
      progress: 85,
      startDate: '2023-10-01',
      expectedCompletion: '2024-03-31'
    },
    {
      title: 'Medication Safety Improvement',
      phase: 'Check',
      progress: 65,
      startDate: '2023-12-01',
      expectedCompletion: '2024-04-30'
    },
    {
      title: 'Care Planning Enhancement',
      phase: 'Do',
      progress: 40,
      startDate: '2024-01-01',
      expectedCompletion: '2024-06-30'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Aged Care Quality Assurance</h1>
        <p className="text-foreground/60 mt-2">Monitor Quality Standards compliance, audits, and continuous improvement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <Shield className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">92%</h3>
          <p className="text-foreground/60">ACQSC Compliance</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{findings.filter(f => f.status !== 'Resolved').length}</h3>
          <p className="text-foreground/60">Open Findings</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-info/10 text-info">
              <Clock className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">{audits.filter(a => a.status === 'Scheduled' || a.status === 'In Progress').length}</h3>
          <p className="text-foreground/60">Active Audits</p>
        </Card>

        <Card className="p-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">+8%</h3>
          <p className="text-foreground/60">Quality Improvement</p>
        </Card>
      </div>

      {/* Key Care Metrics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Key Care Quality Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {careMetrics.map((metric, index) => (
            <div key={index} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-foreground text-sm">{metric.name}</h4>
                <div className={`p-1 rounded-lg ${
                  metric.status === 'good' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {metric.status === 'good' ? 
                    <CheckCircle className="h-4 w-4" /> : 
                    <AlertTriangle className="h-4 w-4" />
                  }
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Current</span>
                  <span className="font-medium text-foreground">{metric.value} {metric.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Target</span>
                  <span className="text-foreground/60">{metric.target} {metric.unit}</span>
                </div>
                <Progress value={metric.percentage} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PDCA Cycle Tracking */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Continuous Quality Improvement (PDCA Cycles)</h3>
        <div className="grid gap-4">
          {pdcaCycles.map((cycle, index) => (
            <div key={index} className="p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-foreground">{cycle.title}</h4>
                  <p className="text-sm text-foreground/60">Started: {cycle.startDate} • Expected completion: {cycle.expectedCompletion}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    cycle.phase === 'Act' ? 'bg-success/20 text-success' :
                    cycle.phase === 'Check' ? 'bg-info/20 text-info' :
                    cycle.phase === 'Do' ? 'bg-warning/20 text-warning' :
                    'bg-coral/20 text-coral'
                  }`}>
                    {cycle.phase} Phase
                  </span>
                  <span className="text-sm font-medium text-foreground">{cycle.progress}%</span>
                </div>
              </div>
              <Progress value={cycle.progress} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Recent ACQSC Audits</h3>
          <div className="space-y-4">
            {audits.map((audit, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    audit.status === 'Completed' ? 'bg-success/10 text-success' :
                    audit.status === 'In Progress' ? 'bg-info/10 text-info' :
                    'bg-warning/10 text-warning'
                  }`}>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{audit.name}</h4>
                    <p className="text-sm text-foreground/60">{audit.type} • {audit.date}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {audit.score && (
                    <div className="text-right">
                      <div className="text-lg font-semibold text-foreground">{audit.score}%</div>
                      <div className="text-xs text-foreground/60">{audit.findings} findings</div>
                    </div>
                  )}
                  
                  <span className={`px-3 py-1 text-xs rounded-full ${
                    audit.status === 'Completed' ? 'bg-success/20 text-success' :
                    audit.status === 'In Progress' ? 'bg-info/20 text-info' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {audit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">Quality Standards Findings</h3>
          <div className="space-y-4">
            {findings.map((finding, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-mono text-foreground/60">{finding.id}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        finding.severity === 'High' ? 'bg-critical/20 text-critical' :
                        finding.severity === 'Medium' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      }`}>
                        {finding.severity}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-info/20 text-info">
                        {finding.standard}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mt-1">{finding.title}</h4>
                  </div>
                  
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    finding.status === 'Resolved' ? 'bg-success/20 text-success' :
                    finding.status === 'In Progress' ? 'bg-info/20 text-info' :
                    'bg-muted text-foreground/60'
                  }`}>
                    {finding.status}
                  </span>
                </div>
                <p className="text-sm text-foreground/60">Assigned to: {finding.assignee}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}