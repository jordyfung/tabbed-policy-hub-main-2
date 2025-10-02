import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import UserProfileDropdown from '@/components/ui/UserProfileDropdown';
import LanguageToggle from '@/components/ui/LanguageToggle';
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
  Bot,
  LogOut,
  User,
  Target,
  Eye,
  EyeOff,
  Rss
} from 'lucide-react';

// Custom emoji icon component to replace Bot icon
const RobotEmoji = ({ className }: { className?: string }) => (
  <span className={cn("flex items-center justify-center", className)} style={{ fontSize: '1rem' }}>👾</span>
);

type Tab = 'dashboard' | 'newsfeed' | 'policies' | 'training' | 'assurance' | 'announcements' | 'admin' | 'profile';

interface SubTab {
  id: string;
  label: string;
  icon: any;
  color: 'primary' | 'success' | 'info';
}

// Tab visibility configuration - set to false to hide tabs without deleting code
const tabVisibility: Record<Tab, boolean> = {
  dashboard: true,
  newsfeed: false,
  policies: true,
  training: true,
  assurance: true,
  announcements: false,
  admin: true,
  profile: true,
};

const tabConfig = {
  profile: {
    label: 'nav.profile',
    icon: User,
    subTabs: []
  },
  dashboard: {
    label: 'nav.dashboard',
    icon: LayoutDashboard,
    subTabs: [
      { id: 'overview', label: 'dashboard.overview', icon: BarChart3, color: 'primary' as const },
      { id: 'standards', label: 'dashboard.standards', icon: Shield, color: 'success' as const },
      { id: 'analytics', label: 'dashboard.analytics', icon: BarChart3, color: 'success' as const },
      { id: 'reports', label: 'dashboard.reports', icon: FileText, color: 'info' as const }
    ]
  },
  newsfeed: {
    label: 'nav.newsfeed',
    icon: Rss,
    subTabs: [
      { id: 'feed', label: 'Feed', icon: Rss, color: 'primary' as const },
      { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: 'info' as const }
    ]
  },
  policies: {
    label: 'nav.policies',
    icon: Shield,
    subTabs: [
      { id: 'documents', label: 'Documents', icon: FileText, color: 'success' as const },
      { id: 'ai-assistant', label: 'AI Assistant', icon: RobotEmoji, color: 'info' as const }
    ]
  },
  training: {
    label: 'nav.training',
    icon: GraduationCap,
    subTabs: [
      { id: 'profile', label: 'Profile', icon: Users, color: 'primary' as const },
      { id: 'courses', label: 'Courses', icon: BookOpen, color: 'info' as const },
      { id: 'team', label: 'Team Management', icon: Users, color: 'primary' as const },
      { id: 'management', label: 'Management', icon: Settings, color: 'primary' as const },
      { id: 'course-management', label: 'Course Management', icon: BookOpen, color: 'info' as const },
      { id: 'assignments', label: 'Assignments', icon: Target, color: 'info' as const }
    ]
  },
  assurance: {
    label: 'nav.assurance',
    icon: CheckCircle,
    subTabs: []
  },
  announcements: {
    label: 'nav.announcements',
    icon: Rss,
    subTabs: []
  },
  admin: {
    label: 'nav.admin',
    icon: Settings,
    subTabs: [
      { id: 'permissions', label: 'dashboard.permissions', icon: Shield, color: 'info' as const },
      { id: 'rag-management', label: 'dashboard.ragManagement', icon: RobotEmoji, color: 'info' as const }
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
  const { t } = useTranslation();
  const { profile, signOut, isAdmin, isSuperAdmin, viewMode, toggleViewMode } = useAuth();
  const { isSubTabEnabled } = usePermissions();
  const [internalActiveSubTab, setInternalActiveSubTab] = useState('overview');
  
  const currentActiveSubTab = activeSubTab || internalActiveSubTab;

  const visibleSubTabs = activeTab === 'policies' ? [] : tabConfig[activeTab].subTabs.filter((subTab) => {
    // In staff view, always apply staff rules, regardless of admin status.
    if (viewMode === 'staff') {
      if (activeTab === 'training') {
        return ['profile', 'courses'].includes(subTab.id);
      }
      // Hide settings/permissions in staff view for all tabs.
      return subTab.id !== 'permissions';
    }

    // If not in staff view, then apply admin rules.
    if (isAdmin) {
      // Super admins see everything.
      if (isSuperAdmin) return true;
      // Regular admins see everything except permissions sub-tab.
      if (subTab.id === 'permissions') return false;
      // All other tabs are controlled by the database permissions.
      return isSubTabEnabled(activeTab, subTab.id);
    }

    // This case should ideally not be hit for logged-in users, but as a fallback:
    return !['permissions', 'management', 'assignments', 'team', 'rag-management'].includes(subTab.id);
  });

  const hasSidebar = visibleSubTabs.length > 0;

  // Auto-redirect to allowed sub-tab when view mode changes
  useEffect(() => {
    const isCurrentSubTabVisible = visibleSubTabs.some(subTab => subTab.id === currentActiveSubTab);
    if (!isCurrentSubTabVisible && visibleSubTabs.length > 0) {
      handleSubTabChange(visibleSubTabs[0].id);
    }
  }, [viewMode, activeTab, currentActiveSubTab, visibleSubTabs]);

  const handleSubTabChange = (subTab: string) => {
    if (onSubTabChange) {
      onSubTabChange(subTab);
    } else {
      setInternalActiveSubTab(subTab);
    }
  };

  const getColorClass = (color: 'primary' | 'success' | 'info', isActive: boolean = false) => {
    if (isActive) {
      return 'bg-primary text-primary-foreground shadow-sm';
    }
    return 'hover:bg-accent text-foreground/70 hover:text-foreground';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-nav-border bg-nav-background">
        <div className="flex h-16 items-center px-6">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-foreground" />
              <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
            </div>
            
            <nav className="flex space-x-1">
              {(() => {
                const filteredTabs = Object.entries(tabConfig)
                  .filter(([key]) => {
                    // Check tab visibility configuration first
                    if (!tabVisibility[key as Tab]) {
                      return false;
                    }

                    // Super admin only tab
                    if (key === 'admin' && !isSuperAdmin) {
                      return false;
                    }

    // Show only policies, training, profile, and announcements when in staff view mode
    if (viewMode === 'staff' && !['policies', 'training', 'profile', 'announcements'].includes(key)) {
      return false;
    }
                    return true;
                  });

                // Reorder tabs based on view mode
                let orderedTabs = filteredTabs;
                
                if (viewMode === 'staff') {
                  // Staff view: policies, training, profile (making profile the third tab)
                  const staffOrder = ['policies', 'training', 'profile'];
                  orderedTabs = [...filteredTabs].sort(([a], [b]) => {
                    const aIndex = staffOrder.indexOf(a);
                    const bIndex = staffOrder.indexOf(b);
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                  });
                } else {
                  // Admin view: put profile before admin
                  const adminOrder = ['dashboard', 'policies', 'training', 'assurance', 'announcements', 'profile', 'admin'];
                  orderedTabs = [...filteredTabs].sort(([a], [b]) => {
                    const aIndex = adminOrder.indexOf(a);
                    const bIndex = adminOrder.indexOf(b);
                    if (aIndex === -1) return 1;
                    if (bIndex === -1) return -1;
                    return aIndex - bIndex;
                  });
                }
                
                return orderedTabs;
              })().map(([key, config]) => {
                  const isActive = activeTab === key;
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={key}
                       onClick={() => {
                         onTabChange(key as Tab);
                         if (key !== 'policies' && config.subTabs.length > 0) {
                          handleSubTabChange(config.subTabs[0].id);
                         }
                       }}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200",
                        isActive 
                          ? "bg-tab-active text-white shadow-sm" 
                          : "text-foreground/70 hover:bg-tab-hover hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{t(config.label)}</span>
                    </button>
                  );
                })}
            </nav>
          </div>
          
          {/* Admin View Toggle, Language Toggle and User Profile */}
          <div className="ml-auto flex items-center space-x-4">
            {isAdmin && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-foreground/60">{t('nav.viewMode')}:</span>
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
                  {viewMode === 'admin' ? t('nav.admin') : t('nav.staff')}
                </span>
              </div>
            )}
            <LanguageToggle />
            <UserProfileDropdown />
          </div>
        </div>
      </header>

      <div className="flex overflow-x-hidden">
        {/* Left Sidebar - Hide for training tab since it has no sub-tabs */}
        {visibleSubTabs.length > 0 && (
          <aside className="hidden md:block md:fixed md:top-16 md:left-0 md:bottom-0 md:w-64 md:overflow-y-auto border-r border-border bg-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide mb-3">
                {t(tabConfig[activeTab].label)}
              </h3>
              <nav className="space-y-1">
                 {visibleSubTabs.map((subTab) => {
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
                        <span>{t(subTab.label)}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn("flex-1 pt-16", hasSidebar ? "md:pl-72" : "", activeTab === 'policies' ? "p-0" : "p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}