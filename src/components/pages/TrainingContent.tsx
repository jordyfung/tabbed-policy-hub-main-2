import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import StaffProfileContent from '@/components/pages/training/StaffProfileContent';
import CoursesContent from '@/components/pages/training/CoursesContent';
import CourseManagement from '@/components/training/CourseManagement';
import CourseAssignments from '@/components/training/CourseAssignments';

interface TrainingContentProps {
  activeSubTab?: string;
}

export default function TrainingContent({ activeSubTab = 'profile' }: TrainingContentProps) {
  const { isAdmin } = useAuth();
  const { isSubTabEnabled } = usePermissions();

  const renderContent = () => {
    switch (activeSubTab) {
      case 'profile':
        return <StaffProfileContent />;
      case 'courses':
        return <CoursesContent />;
      case 'management':
        if (!isAdmin || !isSubTabEnabled('training', 'management')) return <div>Access denied</div>;
        return <CourseManagement />;
      case 'assignments':
        if (!isAdmin || !isSubTabEnabled('training', 'assignments')) return <div>Access denied</div>;
        return <CourseAssignments />;
      default:
        return <StaffProfileContent />;
    }
  };

  return renderContent();
}