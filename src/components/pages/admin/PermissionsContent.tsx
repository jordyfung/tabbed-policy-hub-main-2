import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Users, BookOpen, FileText, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const tabConfig = {
  dashboard: {
    label: 'Dashboard',
    icon: Shield,
    subtabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'standards', label: 'Quality Standards' },
      { id: 'analytics', label: 'Analytics' },
      { id: 'reports', label: 'Reports' },
      { id: 'team', label: 'Team' },
    ],
  },
  newsfeed: {
    label: 'Newsfeed',
    icon: Users, // Using Users icon as a placeholder, can be changed
    subtabs: [
      { id: 'feed', label: 'Feed' },
      { id: 'chat', label: 'AI Chat' },
    ],
  },
  policies: {
    label: 'Policies',
    icon: FileText,
    subtabs: [
      { id: 'documents', label: 'Documents' },
      { id: 'ai-assistant', label: 'AI Assistant' },
    ],
  },
  training: {
    label: 'Training',
    icon: BookOpen,
    subtabs: [
      { id: 'profile', label: 'Profile' },
      { id: 'courses', label: 'Courses' },
      { id: 'management', label: 'Management' },
      { id: 'assignments', label: 'Assignments' },
    ],
  },
  assurance: {
    label: 'Assurance',
    icon: CheckCircle,
    subtabs: [
      { id: 'overview', label: 'Overview' },
      { id: 'feedback', label: 'Feedback & Complaints' },
    ],
  },
};

export default function PermissionsContent() {
  const { isSuperAdmin } = useAuth();
  const { permissions, loading, toggleSubTabPermission, isSubTabEnabled } = usePermissions();

  if (!isSuperAdmin) {
    return (
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Only super administrators can access the permissions management.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Loading permissions...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleToggle = async (tabId: string, subTabId: string) => {
    await toggleSubTabPermission(tabId, subTabId);
    toast.success(`Permission updated for ${tabConfig[tabId as keyof typeof tabConfig]?.label} - ${subTabId}`);
  };

  const resetToDefaults = async () => {
    // This would require a separate API call to reset all permissions to enabled
    toast.info('Reset to defaults functionality would be implemented here');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Permissions Management</h1>
        <p className="text-muted-foreground mt-2">
          Control which sections admin users can access. Super administrators always have full access.
        </p>
      </div>

      <div className="grid gap-6">
        {Object.entries(tabConfig).map(([tabId, config]) => {
          const Icon = config.icon;
          
          return (
            <Card key={tabId}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle>{config.label}</CardTitle>
                    <CardDescription>
                      Manage which {config.label.toLowerCase()} sections admin users can access
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {config.subtabs.map((subtab) => {
                    const enabled = isSubTabEnabled(tabId, subtab.id);
                    
                    return (
                      <div key={subtab.id} className="flex items-center justify-between py-2">
                        <div className="space-y-0.5">
                          <div className="text-sm font-medium">{subtab.label}</div>
                          <div className="text-xs text-muted-foreground">
                            {enabled ? 'Visible to admin users' : 'Hidden from admin users'}
                          </div>
                        </div>
                        <Switch 
                          checked={enabled}
                          onCheckedChange={() => handleToggle(tabId, subtab.id)}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">
            Manage all permissions at once
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  );
}
