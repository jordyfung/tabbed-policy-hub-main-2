import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, ChevronDown } from 'lucide-react';

interface ProfileHeaderProps {
  selectedUserId: string;
  onUserChange: (userId: string) => void;
  staffMembers: Array<{
    user_id: string;
    first_name: string;
    last_name: string;
    role: string;
  }>;
  isAdmin: boolean;
}

export default function ProfileHeader({ 
  selectedUserId, 
  onUserChange, 
  staffMembers, 
  isAdmin 
}: ProfileHeaderProps) {
  const { t } = useTranslation();
  const { profile } = useAuth();

  const currentUser = staffMembers.find(s => s.user_id === selectedUserId);
  const isViewingSelf = selectedUserId === profile?.user_id;

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-12 w-12">
          <AvatarImage src="" alt={`${currentUser.first_name} ${currentUser.last_name}`} />
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-foreground">
              {currentUser.first_name} {currentUser.last_name}
            </h1>
            <Badge variant="outline" className="capitalize">
              {currentUser.role}
            </Badge>
          </div>
          {isAdmin && !isViewingSelf && (
            <p className="text-sm text-foreground/60 mt-1">
              {t('trainingRedesign.header.viewingAs')}
            </p>
          )}
        </div>
      </div>

      {isAdmin && (
        <Select value={selectedUserId} onValueChange={onUserChange}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={t('trainingRedesign.header.switchLearner')} />
          </SelectTrigger>
          <SelectContent>
            {staffMembers.map((staff) => (
              <SelectItem key={staff.user_id} value={staff.user_id}>
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {staff.first_name[0]}{staff.last_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span>{staff.first_name} {staff.last_name}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {staff.role}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
