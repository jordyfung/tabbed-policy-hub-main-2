import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Settings, Bell, Monitor } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useTheme } from 'next-themes';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    trainingReminders: true,
    darkMode: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      darkMode: theme === 'dark'
    }));
  }, [theme]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Apply theme change immediately
      setTheme(settings.darkMode ? 'dark' : 'light');
      
      // TODO: Save other settings to user preferences in Supabase
      // await supabase.from('user_preferences').upsert({
      //   user_id: auth.user?.id,
      //   email_notifications: settings.emailNotifications,
      //   training_reminders: settings.trainingReminders
      // });
      
      toast({
        title: "Settings saved",
        description: "Your account settings have been updated successfully.",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Account Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Notification Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <h3 className="text-sm font-medium">Notifications</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-sm">
                    Email notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive important updates via email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="training-reminders" className="text-sm">
                    Training reminders
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about upcoming training deadlines
                  </p>
                </div>
                <Switch
                  id="training-reminders"
                  checked={settings.trainingReminders}
                  onCheckedChange={(checked) => updateSetting('trainingReminders', checked)}
                />
              </div>
            </div>
          </div>
          
          <Separator />
          
          {/* Appearance Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <h3 className="text-sm font-medium">Appearance</h3>
            </div>
            
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode" className="text-sm">
                    Dark mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use dark theme for the interface
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => updateSetting('darkMode', checked)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={loading}
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}