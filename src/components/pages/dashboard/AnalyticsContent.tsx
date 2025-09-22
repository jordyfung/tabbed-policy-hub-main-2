import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, Filter } from 'lucide-react';

const timeRanges = ['7D', '30D', '90D', '1Y'];

const trendData = [
  { name: 'Jan', value: 400, compliance: 85 },
  { name: 'Feb', value: 300, compliance: 88 },
  { name: 'Mar', value: 500, compliance: 92 },
  { name: 'Apr', value: 450, compliance: 89 },
  { name: 'May', value: 600, compliance: 94 },
  { name: 'Jun', value: 550, compliance: 91 },
];

const chartConfig = {
  value: {
    label: "Value",
    color: "hsl(var(--coral))",
  },
  compliance: {
    label: "Compliance",
    color: "hsl(var(--success))",
  },
};

const complianceData = [
  { name: 'Compliant', value: 78, color: 'hsl(var(--success))' },
  { name: 'At Risk', value: 15, color: 'hsl(var(--info))' },
  { name: 'Non-Compliant', value: 7, color: 'hsl(var(--coral))' },
];

const topMetrics = [
  { label: 'Quality Standards Score', value: '94.2%', change: '+2.1%', trend: 'up' },
  { label: 'Staff Training Compliance', value: '89.7%', change: '+5.3%', trend: 'up' },
  { label: 'Care Minutes Compliance', value: '96.8%', change: '+1.2%', trend: 'up' },
  { label: '24/7 RN Coverage', value: '100%', change: '0%', trend: 'stable' },
];

export default function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">Comprehensive compliance metrics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="flex border rounded-lg p-1">
            {timeRanges.map((range, index) => (
              <Button
                key={range}
                variant={index === 1 ? "default" : "ghost"}
                size="sm"
                className="h-8"
              >
                {range}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {topMetrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                <p className="text-2xl font-bold text-foreground mt-2">{metric.value}</p>
                <div className="flex items-center mt-2">
                  {metric.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-success mr-1" />
                  ) : metric.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-coral mr-1" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted-foreground mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success' : 
                    metric.trend === 'down' ? 'text-coral' : 'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Compliance Trends</h3>
            <Badge variant="outline">Last 6 months</Badge>
          </div>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="compliance" 
                  stroke="hsl(var(--success))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--success))", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Compliance Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Compliance Distribution</h3>
            <Badge variant="outline">Current Status</Badge>
          </div>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={complianceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {complianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      </div>

      {/* Data Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Department Performance</h3>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Department</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Compliance Rate</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Training Progress</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Risk Level</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Last Audit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { dept: 'Clinical Care', compliance: '96%', training: '94%', risk: 'Low', audit: '2 weeks ago' },
                { dept: 'Personal Care', compliance: '89%', training: '87%', risk: 'Medium', audit: '1 month ago' },
                { dept: 'Lifestyle & Wellbeing', compliance: '94%', training: '95%', risk: 'Low', audit: '3 weeks ago' },
                { dept: 'Administration', compliance: '98%', training: '99%', risk: 'Low', audit: '1 week ago' },
                { dept: 'Facilities & Maintenance', compliance: '91%', training: '88%', risk: 'Medium', audit: '2 months ago' },
              ].map((row, index) => (
                <tr key={index} className="border-b border-border hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium text-foreground">{row.dept}</td>
                  <td className="py-3 px-4">
                    <span className="text-success font-medium">{row.compliance}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-info font-medium">{row.training}</span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={row.risk === 'Low' ? 'default' : 'secondary'}>
                      {row.risk}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{row.audit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}