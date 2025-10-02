import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { User, Settings, LogOut, Camera } from 'lucide-react';
import ViewProfileModal from '@/components/ui/modals/ViewProfileModal';
import UpdatePhotoModal from '@/components/ui/modals/UpdatePhotoModal';
import AccountSettingsModal from '@/components/ui/modals/AccountSettingsModal';

export default function UserProfileDropdown() {
  const { t } = useTranslation();
  const { profile, signOut, isAdmin, isSuperAdmin, viewMode } = useAuth();
  const [viewProfileOpen, setViewProfileOpen] = useState(false);
  const [updatePhotoOpen, setUpdatePhotoOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);

  if (!profile) return null;

  const initials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase();
  
  const getPhotoUrl = (url?: string | null) => {
    if (!url) return '';
    return `${url}?t=${Date.now()}`;
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleViewProfile = () => {
    setViewProfileOpen(true);
  };

  const handleUpdatePhoto = () => {
    setUpdatePhotoOpen(true);
  };

  const handleAccountSettings = () => {
    setAccountSettingsOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage src={getPhotoUrl(profile.photo_url)} alt={`${profile.first_name} ${profile.last_name}`} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64" align="end" forceMount>
          <div className="flex items-center space-x-3 p-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={getPhotoUrl(profile.photo_url)} alt={`${profile.first_name} ${profile.last_name}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {profile.first_name} {profile.last_name}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {profile.email}
              </p>
              {isAdmin && (
                <div className="flex items-center space-x-1">
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">
                    {isSuperAdmin
                      ? (viewMode === 'admin' ? t('userProfile.superAdmin') : `${t('userProfile.superAdmin')} (${t('userProfile.staffView')})`)
                      : (viewMode === 'admin' ? t('userProfile.admin') : `${t('userProfile.admin')} (${t('userProfile.staffView')})`)
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem className="cursor-pointer" onClick={handleViewProfile}>
            <User className="mr-2 h-4 w-4" />
            <span>{t('userProfile.viewProfile')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={handleUpdatePhoto}>
            <Camera className="mr-2 h-4 w-4" />
            <span>{t('userProfile.updatePhoto')}</span>
          </DropdownMenuItem>

          <DropdownMenuItem className="cursor-pointer" onClick={handleAccountSettings}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('userProfile.accountSettings')}</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="cursor-pointer text-destructive focus:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('userProfile.signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ViewProfileModal 
        open={viewProfileOpen} 
        onOpenChange={setViewProfileOpen} 
      />
      
      <UpdatePhotoModal 
        open={updatePhotoOpen} 
        onOpenChange={setUpdatePhotoOpen} 
      />
      
      <AccountSettingsModal 
        open={accountSettingsOpen} 
        onOpenChange={setAccountSettingsOpen} 
      />
    </>
  );
}