import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import StaffProfileContent from '@/components/pages/training/StaffProfileContent';
import StaffProfileContentRedesigned from '@/components/pages/training/StaffProfileContentRedesigned';
import CoursesContent from '@/components/pages/training/CoursesContent';
import CourseManagement from '@/components/training/CourseManagement';
import CourseAssignments from '@/components/training/CourseAssignments';
import TeamManagementContent from '@/components/pages/training/TeamManagementContent';

interface TrainingContentProps {
  activeSubTab?: string;
}

export default function TrainingContent({ activeSubTab = 'profile' }: TrainingContentProps) {
  const { isAdmin, viewMode } = useAuth();
  const { isSubTabEnabled } = usePermissions();

  // Feature flag for training redesign
  const useRedesignedProfile = true; // TODO: Make this configurable via environment or user preference

  const renderContent = () => {
    switch (activeSubTab) {
      case 'profile':
        return useRedesignedProfile ? <StaffProfileContentRedesigned /> : <StaffProfileContent />;
      case 'courses':
        return <CoursesContent />;
      case 'team':
        if (!isAdmin || !isSubTabEnabled('training', 'team')) {
          return <div>Access denied</div>;
        }
        return <TeamManagementContent />;
      case 'management':
        if (!isAdmin || !isSubTabEnabled('training', 'management')) {
          return <div>Access denied</div>;
        }
        return <CourseManagement />;
      case 'assignments':
        if (!isAdmin || !isSubTabEnabled('training', 'assignments')) {
          return <div>Access denied</div>;
        }
        return <CourseAssignments />;
      default:
        return useRedesignedProfile ? <StaffProfileContentRedesigned /> : <StaffProfileContent />;
    }
  };

  return renderContent();
}