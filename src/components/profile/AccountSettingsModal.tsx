import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AccountSettingsModal({ open, onOpenChange }: AccountSettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [trainingReminders, setTrainingReminders] = useState(true);
  const [complianceAlerts, setComplianceAlerts] = useState(true);
  const [theme, setTheme] = useState('system');
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Change language immediately
      await i18n.changeLanguage(language);

      // In a real implementation, this would save to a user_preferences table
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: t('accountSettings.saveSettings'),
        description: "Your account settings have been updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('accountSettings.title')}</DialogTitle>
          <DialogDescription>
            {t('accountSettings.description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('accountSettings.notifications')}</h3>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('accountSettings.emailNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountSettings.emailNotificationsDesc')}
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('accountSettings.pushNotifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountSettings.pushNotificationsDesc')}
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('accountSettings.trainingReminders')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountSettings.trainingRemindersDesc')}
                </p>
              </div>
              <Switch
                checked={trainingReminders}
                onCheckedChange={setTrainingReminders}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('accountSettings.complianceAlerts')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('accountSettings.complianceAlertsDesc')}
                </p>
              </div>
              <Switch
                checked={complianceAlerts}
                onCheckedChange={setComplianceAlerts}
              />
            </div>
          </div>

          <Separator />

          {/* Appearance Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">{t('accountSettings.appearance')}</h3>

            <div className="space-y-2">
              <Label>{t('accountSettings.theme')}</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('themes.light')}</SelectItem>
                  <SelectItem value="dark">{t('themes.dark')}</SelectItem>
                  <SelectItem value="system">{t('themes.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('accountSettings.language')}</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">{t('languages.en')}</SelectItem>
                  <SelectItem value="zh">{t('languages.zh')}</SelectItem>
                  <SelectItem value="es">{t('languages.es')}</SelectItem>
                  <SelectItem value="fr">{t('languages.fr')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('accountSettings.cancel')}
          </Button>
          <Button onClick={handleSaveSettings} disabled={isLoading}>
            {isLoading ? t('accountSettings.saving') : t('accountSettings.saveSettings')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}