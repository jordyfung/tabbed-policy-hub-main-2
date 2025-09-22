import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import { 
  LayoutDashboard, 
  Shield, 
  GraduationCap, 
  CheckCircle, 
  MessageSquare,
  ChevronRight,
  FileText,
  BarChart3,
  Users,
  Settings,
  BookOpen,
  Video,
  Award,
  ClipboardList,
  Bot,
  LogOut,
  User,
  Target,
  Eye,
  EyeOff,
  Rss
} from 'lucide-react';

type Tab = 'dashboard' | 'newsfeed' | 'policies' | 'training' | 'assurance';

interface SubTab {
  id: string;
  label: string;
  icon: any;
  color: 'coral' | 'success' | 'info';
}

const tabConfig = {
  dashboard: {
    label: 'Dashboard',
    icon: LayoutDashboard,
    subTabs: [
      { id: 'overview', label: 'Overview', icon: BarChart3, color: 'coral' as const },
      { id: 'standards', label: 'Quality Standards', icon: Shield, color: 'success' as const },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'success' as const },
      { id: 'reports', label: 'Reports', icon: FileText, color: 'info' as const },
      { id: 'team', label: 'Team', icon: Users, color: 'coral' as const },
      { id: 'permissions', label: 'Permissions', icon: Settings, color: 'info' as const }
    ]
  },
  newsfeed: {
    label: 'Newsfeed',
    icon: Rss,
    subTabs: [
      { id: 'feed', label: 'Feed', icon: Rss, color: 'coral' as const },
      { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: 'info' as const }
    ]
  },
  policies: {
    label: 'Policies',
    icon: Shield,
    subTabs: [
      { id: 'documents', label: 'Documents', icon: FileText, color: 'success' as const },
      { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare, color: 'info' as const },
      { id: 'compliance', label: 'Compliance', icon: CheckCircle, color: 'coral' as const },
      { id: 'updates', label: 'Updates', icon: ChevronRight, color: 'info' as const },
      { id: 'archive', label: 'Archive', icon: ClipboardList, color: 'success' as const }
    ]
  },
  training: {
    label: 'Training',
    icon: GraduationCap,
    subTabs: [
      { id: 'profile', label: 'Profile', icon: Users, color: 'coral' as const },
      { id: 'overview', label: 'Overview', icon: BarChart3, color: 'success' as const },
      { id: 'courses', label: 'Courses', icon: BookOpen, color: 'info' as const },
      { id: 'management', label: 'Management', icon: Settings, color: 'coral' as const },
      { id: 'assignments', label: 'Assignments', icon: Target, color: 'info' as const }
    ]
  },
  assurance: {
    label: 'Assurance',
    icon: CheckCircle,
    subTabs: [
      { id: 'audits', label: 'Audits', icon: ClipboardList, color: 'coral' as const },
      { id: 'assessments', label: 'Assessments', icon: CheckCircle, color: 'success' as const },
      { id: 'findings', label: 'Findings', icon: FileText, color: 'info' as const },
      { id: 'remediation', label: 'Remediation', icon: Settings, color: 'coral' as const }
    ]
  }
};

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  activeSubTab?: string;
  onSubTabChange?: (subTab: string) => void;
}

export default function MainLayout({ 
  children, 
  activeTab, 
  onTabChange, 
  activeSubTab = 'overview',
  onSubTabChange 
}: MainLayoutProps) {
  const { profile, signOut, isAdmin, isSuperAdmin, viewMode, toggleViewMode } = useAuth();
  const { isSubTabEnabled } = usePermissions();
  const [internalActiveSubTab, setInternalActiveSubTab] = useState('overview');
  
  const currentActiveSubTab = activeSubTab || internalActiveSubTab;
  
  const handleSubTabChange = (subTab: string) => {
    if (onSubTabChange) {
      onSubTabChange(subTab);
    } else {
      setInternalActiveSubTab(subTab);
    }
  };

  const getColorClass = (color: 'coral' | 'success' | 'info', isActive: boolean = false) => {
    if (isActive) {
      return 'bg-primary text-primary-foreground shadow-sm';
    }
    return 'hover:bg-accent text-foreground/70 hover:text-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="border-b border-nav-border bg-nav-background">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-coral" />
              <span className="text-xl font-bold text-foreground">OriComply</span>
            </div>
            
            <nav className="flex space-x-1">
              {Object.entries(tabConfig)
                .filter(([key]) => {
                  // Show only policies and training when in staff view mode
                  if (viewMode === 'staff' && !['policies', 'training', 'newsfeed'].includes(key)) {
                    return false;
                  }
                  return true;
                })
                .map(([key, config]) => {
                  const isActive = activeTab === key;
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={key}
                       onClick={() => {
                         onTabChange(key as Tab);
                         handleSubTabChange(config.subTabs[0].id);
                       }}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                        isActive 
                          ? "bg-tab-active text-white shadow-sm" 
                          : "text-foreground/70 hover:bg-tab-hover hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{config.label}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
          
          {/* Admin View Toggle and User Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground/60">View Mode:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleViewMode}
                  className="p-2 hover:bg-muted"
                >
                  {viewMode === 'admin' ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <span className="text-sm text-foreground/60">
                  {viewMode === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
            )}
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Left Sidebar - Hide for training tab since it has no sub-tabs */}
        {tabConfig[activeTab].subTabs.length > 0 && (
          <aside className="w-64 border-r border-border bg-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide mb-3">
                {tabConfig[activeTab].label}
              </h3>
              <nav className="space-y-1">
                 {tabConfig[activeTab].subTabs
                  .filter((subTab) => {
                    // Super admin sees everything
                    if (isSuperAdmin) return true;
                    
                    // Permissions sub-tab only for super admin
                    if (subTab.id === 'permissions') return false;
                    
                    // Regular admin sees based on permissions when in admin view
                    if (isAdmin && viewMode === 'admin') {
                      return isSubTabEnabled(activeTab, subTab.id);
                    }
                    
                    // Staff view filtering
                    if (!isAdmin || viewMode === 'staff') {
                      if (activeTab === 'training') {
                        // Staff can only see profile and courses in training
                        return subTab.id === 'profile' || subTab.id === 'courses';
                      }
                      // For other tabs, show all
                      return true;
                    }
                    
                    return true;
                  })
                  .map((subTab) => {
                    const isActive = currentActiveSubTab === subTab.id;
                    const Icon = subTab.icon;
                    
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => handleSubTabChange(subTab.id)}
                        className={cn(
                          "w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive 
                            ? getColorClass(subTab.color, true)
                            : getColorClass(subTab.color, false)
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span>{subTab.label}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}