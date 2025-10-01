import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Database, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { NotionExtractor } from '@/services/notionExtractor';
import { RAGService } from '@/services/ragService';
import { supabase } from '@/integrations/supabase/client';

interface SyncStatus {
  totalPolicies: number;
  lastSync: string | null;
  recentSearches: number;
  recentErrors: number;
}

export default function RagSyncManager() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const notionExtractor = new NotionExtractor();
  const ragService = new RAGService();

  useEffect(() => {
    loadSyncStatus();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await ragService.getSystemStats();
      setSyncStatus(status);
    } catch (error) {
      console.error('Error loading sync status:', error);
      // If tables don't exist, show helpful message
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        setError('RAG database tables not found. Click "Sync Now" to initialize the system.');
      } else {
        setError('Failed to load system status: ' + error.message);
      }
    }
  };

  const createTablesIfNeeded = async () => {
    setSyncMessage('Checking database tables...');

    // Try a simple query to see if tables exist
    try {
      const { error } = await supabase
        .from('policy_embeddings')
        .select('id')
        .limit(1);

      if (error && error.message?.includes('does not exist')) {
        setSyncMessage('Database tables not found. Please create them manually in Supabase Dashboard.');
        setError('RAG tables not found. Go to Supabase Dashboard → SQL Editor and run the migration SQL.');
        setIsSyncing(false);
        return false;
      }
    } catch (error) {
      console.warn('Table check failed:', error);
    }

    return true;
  };

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    setSyncProgress(0);
    setError(null);
    setSyncMessage('Initializing sync process...');

    try {
      // Check if tables exist
      const tablesExist = await createTablesIfNeeded();
      if (!tablesExist) {
        return; // Error already set, sync cancelled
      }

      // Check environment variables
      const notionDatabaseId = import.meta.env.VITE_NOTION_DATABASE_ID;
      if (!notionDatabaseId) {
        throw new Error('VITE_NOTION_DATABASE_ID environment variable is not set');
      }

      // Call Supabase Edge Function for Notion extraction (server-side to avoid CORS)
      setSyncMessage('Extracting pages from Notion (server-side)...');
      setSyncProgress(10);

      try {
        const { data, error } = await supabase.functions.invoke('rag-api', {
          body: {
            action: 'sync',
            databaseId: notionDatabaseId
          }
        });

        if (error) {
          console.error('Edge Function error:', error);
          if (error.message?.includes('not found') || error.message?.includes('404')) {
            throw new Error('Edge Function not deployed or accessible. Please contact support.');
          }
          throw new Error(`Server error: ${error.message}`);
        }

        if (!data.success) {
          console.error('Edge Function returned error:', data.error);
          if (data.error?.includes('NOTION_API_KEY not configured')) {
            throw new Error('Server environment not configured. Please contact your administrator to set up the RAG API secrets.');
          }
          throw new Error(data.error || 'Unknown server error');
        }

        setSyncMessage('Notion data extracted and processed successfully!');
        setSyncProgress(100);

        // Reload status
        await loadSyncStatus();

        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setSyncMessage('');
        }, 5000);
      } catch (error) {
        console.error('Supabase sync error:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred during sync');
        setSyncMessage('');
      }
    } catch (error) {
      console.error('Sync error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred during sync');
      setSyncMessage('');
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
    };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">RAG System Management</h2>
        <p className="text-foreground/60 mt-2">
          Manage the Retrieval-Augmented Generation system for policy documents
        </p>
      </div>

      {/* System Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>System Status</span>
          </CardTitle>
          <CardDescription>
            Current state of the RAG knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent>
          {syncStatus ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{syncStatus.totalPolicies}</div>
                <div className="text-sm text-foreground/60">Total Policies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{syncStatus.recentSearches}</div>
                <div className="text-sm text-foreground/60">Searches (24h)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{syncStatus.recentErrors}</div>
                <div className="text-sm text-foreground/60">Errors (24h)</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-foreground/60">Last Sync</div>
                <div className="text-xs text-foreground/80">{formatDate(syncStatus.lastSync)}</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <Clock className="h-8 w-8 text-foreground/40 mx-auto mb-2" />
              <p className="text-foreground/60">Loading system status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sync Control Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Data Synchronization</span>
          </CardTitle>
          <CardDescription>
            Sync policy documents from Notion to update the AI knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center space-x-2"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </Button>

              {syncStatus && syncStatus.totalPolicies > 0 && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Ready</span>
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadSyncStatus}
              disabled={isSyncing}
            >
              Refresh Status
            </Button>
          </div>

          {/* Progress Bar */}
          {isSyncing && (
            <div className="space-y-2">
              <Progress value={syncProgress} className="w-full" />
              <p className="text-sm text-foreground/60">{syncMessage}</p>
            </div>
          )}

          {/* Success Message */}
          {syncMessage && !isSyncing && !error && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {syncMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Environment Check Card */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Required environment variables for RAG functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { name: 'VITE_NOTION_API_KEY', required: true },
              { name: 'VITE_NOTION_DATABASE_ID', required: true },
              { name: 'VITE_OPENAI_API_KEY', required: true },
              { name: 'VITE_SUPABASE_URL', required: false },
              { name: 'VITE_SUPABASE_ANON_KEY', required: false },
            ].map(({ name, required }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="font-mono text-sm">{name}</span>
                <Badge
                  variant={import.meta.env[name] ? 'default' : required ? 'destructive' : 'secondary'}
                >
                  {import.meta.env[name] ? 'Set' : required ? 'Missing' : 'Optional'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
