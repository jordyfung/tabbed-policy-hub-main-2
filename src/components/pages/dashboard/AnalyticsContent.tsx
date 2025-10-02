import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Download, Filter, Building, AlertTriangle } from 'lucide-react';

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
    color: "hsl(var(--primary))",
  },
  compliance: {
    label: "Compliance",
    color: "hsl(var(--success))",
  },
};

const complianceData = [
  { name: 'Compliant', value: 78, color: 'hsl(var(--success))' },
  { name: 'At Risk', value: 15, color: 'hsl(var(--info))' },
  { name: 'Non-Compliant', value: 7, color: 'hsl(var(--primary))' },
];

const topMetrics = [
  { label: 'Quality Standards Score', value: '94.2%', change: '+2.1%', trend: 'up' },
  { label: 'Staff Training Compliance', value: '89.7%', change: '+5.3%', trend: 'up' },
  { label: 'Care Minutes Compliance', value: '96.8%', change: '+1.2%', trend: 'up' },
];

export default function AnalyticsContent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
          <p className="text-muted-foreground mt-2">Key compliance metrics and trends</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => console.log('Export analytics data')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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
                    <TrendingDown className="h-4 w-4 text-primary mr-1" />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-muted-foreground mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    metric.trend === 'up' ? 'text-success' : 
                    metric.trend === 'down' ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Compliance Trend Chart */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Departments</p>
              <p className="text-2xl font-bold text-foreground">5</p>
            </div>
            <div className="p-3 rounded-lg bg-info/10 text-info">
              <Building className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Compliance</p>
              <p className="text-2xl font-bold text-foreground">93.6%</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 text-success">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Departments at Risk</p>
              <p className="text-2xl font-bold text-foreground">2</p>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 text-warning">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}