import ChatInterface from '@/components/ui/chat-interface';

interface PoliciesContentProps {
  activeSubTab?: string;
}

export default function PoliciesContent({ activeSubTab = 'documents' }: PoliciesContentProps) {
  const renderContent = () => {
    switch (activeSubTab) {
      case 'ai-assistant':
        return (
          <div className="h-full" style={{ height: 'calc(100vh - 200px)' }}>
            <ChatInterface />
          </div>
        );
      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Documents</h1>
              <p className="text-foreground/60 mt-2">Access and manage your organization's policy documentation</p>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src="https://cyber-mosquito-7ab.notion.site/ebd/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd"
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full border-0"
                title="Policy Documents"
              />
            </div>
          </div>
        );
      case 'compliance':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Quality Standards Compliance</h1>
              <p className="text-foreground/60 mt-2">Monitor compliance against Australian Aged Care Strengthened Quality Standards</p>
            </div>

            {/* Quality Standards Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Governance', score: 94, status: 'compliant', policies: 12 },
                { name: 'Clinical Care', score: 91, status: 'compliant', policies: 18 },
                { name: 'Personal Care', score: 88, status: 'at-risk', policies: 15 },
                { name: 'Environment', score: 96, status: 'compliant', policies: 8 }
              ].map((standard, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{standard.name}</h3>
                    <div className={`w-3 h-3 rounded-full ${
                      standard.status === 'compliant' ? 'bg-success' :
                      standard.status === 'at-risk' ? 'bg-warning' : 'bg-coral'
                    }`} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Compliance Score</span>
                      <span className="font-medium">{standard.score}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Policies</span>
                      <span className="font-medium">{standard.policies}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Policy Compliance Matrix */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Policy Compliance Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Quality Standard</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Policy Count</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Current Review</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Next Review</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { standard: 'Governance & Leadership', count: 12, current: '94%', next: '2 weeks', status: 'current' },
                      { standard: 'Clinical Care', count: 18, current: '91%', next: '1 month', status: 'current' },
                      { standard: 'Personal Care & Clinical Care', count: 15, current: '88%', next: '3 days', status: 'due' },
                      { standard: 'Services & Supports', count: 10, current: '96%', next: '5 weeks', status: 'current' },
                      { standard: 'Organisation\'s Service Environment', count: 8, current: '92%', next: '2 months', status: 'current' },
                      { standard: 'Feedback & Complaints', count: 6, current: '89%', next: '1 week', status: 'due' },
                      { standard: 'Human Resources', count: 14, current: '93%', next: '6 weeks', status: 'current' },
                      { standard: 'Organisational Governance', count: 9, current: '95%', next: '3 months', status: 'current' }
                    ].map((row, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-foreground">{row.standard}</td>
                        <td className="py-3 px-4 text-muted-foreground">{row.count}</td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-success">{row.current}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{row.next}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            row.status === 'current' ? 'bg-success/10 text-success' :
                            row.status === 'due' ? 'bg-warning/10 text-warning' : 'bg-coral/10 text-coral'
                          }`}>
                            {row.status === 'current' ? 'Current' :
                             row.status === 'due' ? 'Review Due' : 'Overdue'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'updates':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Updates & Alerts</h1>
              <p className="text-foreground/60 mt-2">Recent changes, upcoming reviews, and compliance notifications</p>
            </div>

            {/* Alert Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-coral/10 border border-coral/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-coral rounded-full"></div>
                  <span className="font-semibold text-coral">Urgent Reviews</span>
                </div>
                <p className="text-2xl font-bold text-coral">3</p>
                <p className="text-sm text-coral/70">Due within 7 days</p>
              </div>
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <span className="font-semibold text-warning">Upcoming Reviews</span>
                </div>
                <p className="text-2xl font-bold text-warning">8</p>
                <p className="text-sm text-warning/70">Due within 30 days</p>
              </div>
              <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="font-semibold text-success">Recently Updated</span>
                </div>
                <p className="text-2xl font-bold text-success">12</p>
                <p className="text-sm text-success/70">Last 30 days</p>
              </div>
            </div>

            {/* Recent Updates Feed */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Policy Updates</h3>
              <div className="space-y-4">
                {[
                  {
                    title: 'Medication Management Policy',
                    standard: 'Clinical Care',
                    type: 'Updated',
                    date: '2 hours ago',
                    description: 'Updated dosage calculation procedures and emergency protocols',
                    priority: 'high'
                  },
                  {
                    title: 'Resident Rights and Dignity Policy',
                    standard: 'Personal Care',
                    type: 'Review Due',
                    date: '3 days',
                    description: 'Annual review scheduled for compliance with updated standards',
                    priority: 'medium'
                  },
                  {
                    title: 'Infection Control Procedures',
                    standard: 'Clinical Care',
                    type: 'Updated',
                    date: '1 week ago',
                    description: 'Enhanced protocols following latest health department guidelines',
                    priority: 'high'
                  },
                  {
                    title: 'Complaints Handling Procedure',
                    standard: 'Feedback & Complaints',
                    type: 'New',
                    date: '2 weeks ago',
                    description: 'New streamlined process for resident and family feedback',
                    priority: 'medium'
                  }
                ].map((update, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-2 ${
                      update.priority === 'high' ? 'bg-coral' :
                      update.priority === 'medium' ? 'bg-warning' : 'bg-success'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-foreground">{update.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          update.type === 'Updated' ? 'bg-info/10 text-info' :
                          update.type === 'New' ? 'bg-success/10 text-success' :
                          'bg-warning/10 text-warning'
                        }`}>
                          {update.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{update.description}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Quality Standard: {update.standard}</span>
                        <span>{update.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'archive':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Document Archive</h1>
              <p className="text-foreground/60 mt-2">Historical policy versions and archived documents with full audit trail</p>
            </div>

            {/* Archive Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Archived', value: '156', desc: 'Documents' },
                { label: 'Version History', value: '423', desc: 'Revisions' },
                { label: 'Retention Period', value: '7', desc: 'Years' },
                { label: 'Storage Used', value: '2.4', desc: 'GB' }
              ].map((stat, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.desc}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Archived Documents */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Archived Documents</h3>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 text-sm border border-border rounded">Filter by Year</button>
                  <button className="px-3 py-1 text-sm border border-border rounded">Search Archive</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Document</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Version</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Archived Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Reason</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Retention Until</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        name: 'Resident Assessment Policy v2.1',
                        version: '2.1',
                        archived: '2023-12-15',
                        reason: 'Policy Update',
                        retention: '2030-12-15'
                      },
                      {
                        name: 'Staff Training Manual v1.8',
                        version: '1.8',
                        archived: '2023-11-20',
                        reason: 'Regulatory Change',
                        retention: '2030-11-20'
                      },
                      {
                        name: 'Emergency Response Procedures v3.2',
                        version: '3.2',
                        archived: '2023-10-30',
                        reason: 'Process Improvement',
                        retention: '2030-10-30'
                      },
                      {
                        name: 'Quality Improvement Framework v1.5',
                        version: '1.5',
                        archived: '2023-09-18',
                        reason: 'Standards Update',
                        retention: '2030-09-18'
                      }
                    ].map((doc, index) => (
                      <tr key={index} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-foreground">{doc.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{doc.version}</td>
                        <td className="py-3 px-4 text-muted-foreground">{doc.archived}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                            {doc.reason}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{doc.retention}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Documents</h1>
              <p className="text-foreground/60 mt-2">Access and manage your organization's policy documentation</p>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src="https://cyber-mosquito-7ab.notion.site/ebd/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd"
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full border-0"
                title="Policy Documents"
              />
            </div>
          </div>
        );
    }
  };

  return renderContent();
}