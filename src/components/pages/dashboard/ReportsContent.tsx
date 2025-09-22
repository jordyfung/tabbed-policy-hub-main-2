import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Calendar, 
  Clock, 
  Settings, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Share2
} from 'lucide-react';

const reportTemplates = [
  {
    name: 'ACQSC Compliance Report',
    description: 'Comprehensive compliance status against Strengthened Quality Standards',
    lastGenerated: '2 hours ago',
    type: 'Regulatory',
    status: 'Ready',
    downloads: 47
  },
  {
    name: 'Staff Training & Competency Report',
    description: 'Role-based training completion and competency validation',
    lastGenerated: '1 day ago',
    type: 'Standard',
    status: 'Ready',
    downloads: 23
  },
  {
    name: 'Care Minutes Compliance Report',
    description: 'Mandatory care minutes tracking and RN coverage analysis',
    lastGenerated: '3 days ago',
    type: 'Regulatory',
    status: 'Generating',
    downloads: 15
  },
  {
    name: 'Quality Indicator Dashboard',
    description: 'Key performance indicators and resident outcomes',
    lastGenerated: '1 week ago',
    type: 'Executive',
    status: 'Ready',
    downloads: 31
  },
  {
    name: 'Incident & Complaints Summary',
    description: 'Incident reports, complaints analysis, and corrective actions',
    lastGenerated: '5 days ago',
    type: 'Standard',
    status: 'Ready',
    downloads: 18
  },
  {
    name: 'PDCA Improvement Tracking',
    description: 'Plan-Do-Check-Act cycle progress and outcomes',
    lastGenerated: '1 week ago',
    type: 'Quality',
    status: 'Ready',
    downloads: 12
  }
];

const scheduledReports = [
  {
    name: 'Weekly Compliance Dashboard',
    schedule: 'Every Monday 9:00 AM',
    recipients: 5,
    nextRun: 'Tomorrow 9:00 AM',
    status: 'Active'
  },
  {
    name: 'Monthly Risk Analysis',
    schedule: 'First Monday of month',
    recipients: 3,
    nextRun: 'Dec 2, 2024',
    status: 'Active'
  },
  {
    name: 'Quarterly Executive Summary',
    schedule: 'Every quarter end',
    recipients: 12,
    nextRun: 'Dec 31, 2024',
    status: 'Paused'
  }
];

const recentReports = [
  {
    name: 'Q4 2024 Compliance Report.pdf',
    generatedBy: 'System',
    date: '2 hours ago',
    size: '2.4 MB',
    type: 'PDF'
  },
  {
    name: 'Training_Progress_Nov_2024.xlsx',
    generatedBy: 'Sarah Chen',
    date: '1 day ago',
    size: '1.8 MB',
    type: 'Excel'
  },
  {
    name: 'Risk_Assessment_Summary.pdf',
    generatedBy: 'Michael Torres',
    date: '3 days ago',
    size: '3.1 MB',
    type: 'PDF'
  },
  {
    name: 'Department_Audit_Results.pdf',
    generatedBy: 'System',
    date: '5 days ago',
    size: '4.2 MB',
    type: 'PDF'
  }
];

export default function ReportsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">Generate and manage compliance reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button className="bg-coral hover:bg-coral/90 text-coral-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        </div>
      </div>

      {/* Report Templates */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Report Templates</h3>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Manage Templates
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reportTemplates.map((template, index) => (
            <Card key={index} className="p-4 border border-border hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                  </div>
                </div>
                <Badge variant={template.status === 'Ready' ? 'default' : 'secondary'}>
                  {template.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>Last generated: {template.lastGenerated}</span>
                <span>{template.downloads} downloads</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button 
                  size="sm" 
                  className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                  disabled={template.status !== 'Ready'}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Generate
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Recent Reports & Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Reports</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentReports.map((report, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-background rounded">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{report.name}</p>
                    <p className="text-xs text-muted-foreground">
                      By {report.generatedBy} • {report.date} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button size="sm" variant="ghost">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Scheduled Reports */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Scheduled Reports</h3>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
          <div className="space-y-4">
            {scheduledReports.map((report, index) => (
              <div key={index} className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-foreground">{report.name}</h4>
                  <Badge variant={report.status === 'Active' ? 'default' : 'secondary'}>
                    {report.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{report.schedule}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>Next run: {report.nextRun}</span>
                  </div>
                  <p>{report.recipients} recipients</p>
                </div>
                <div className="flex items-center space-x-2 mt-3">
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Settings className="h-4 w-4 mr-1" />
                    Configure
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Report Builder Preview */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Custom Report Builder</h3>
          <Button className="bg-info hover:bg-info/90 text-info-foreground">
            Open Builder
          </Button>
        </div>
        <div className="bg-muted/30 border-2 border-dashed border-border rounded-lg p-8 text-center">
          <div className="space-y-3">
            <div className="mx-auto w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-medium text-foreground">Create Custom Reports</h4>
            <p className="text-muted-foreground max-w-md mx-auto">
              Drag and drop data sources, configure filters, and design your perfect compliance report
            </p>
            <Button variant="outline">
              Start Building
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}