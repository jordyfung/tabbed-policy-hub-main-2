import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RagSyncManager from '@/components/admin/RagSyncManager';
import RagSystemTester from '@/components/admin/RagSystemTester';
import { Database, Search, TestTube } from 'lucide-react';

export default function RagManagementContent() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">RAG System Management</h1>
        <p className="text-foreground/60 mt-2">
          Manage the AI assistant's knowledge base and test system functionality
        </p>
      </div>

      <Tabs defaultValue="sync" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Data Sync</span>
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center space-x-2">
            <TestTube className="h-4 w-4" />
            <span>System Test</span>
          </TabsTrigger>
          <TabsTrigger value="monitor" className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Monitoring</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sync">
          <RagSyncManager />
        </TabsContent>

        <TabsContent value="test">
          <RagSystemTester />
        </TabsContent>

        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle>System Monitoring</CardTitle>
              <CardDescription>
                Monitor RAG system performance and usage metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Monitoring Dashboard
                </h3>
                <p className="text-foreground/60">
                  Detailed monitoring features will be available here, including:
                </p>
                <ul className="text-sm text-foreground/60 mt-4 space-y-1">
                  <li>• Query performance metrics</li>
                  <li>• Error rate tracking</li>
                  <li>• Usage analytics</li>
                  <li>• System health indicators</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
