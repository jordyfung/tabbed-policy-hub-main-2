import { useState } from 'react';
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

type Tab = 'dashboard' | 'newsfeed' | 'policies' | 'training' | 'assurance' | 'announcements';

interface SubTab {
  id: string;
  label: string;
  icon: any;
  color: 'coral' | 'success' | 'info';
}

// Tab visibility configuration - set to false to hide tabs without deleting code
const tabVisibility: Record<Tab, boolean> = {
  dashboard: true,
  newsfeed: false,
  policies: true,
  training: true,
  assurance: true,
  announcements: false,
};

const tabConfig = {
  dashboard: {
    label: 'nav.dashboard',
    icon: LayoutDashboard,
    subTabs: [
      { id: 'overview', label: 'dashboard.overview', icon: BarChart3, color: 'coral' as const },
      { id: 'standards', label: 'dashboard.standards', icon: Shield, color: 'success' as const },
      { id: 'analytics', label: 'dashboard.analytics', icon: BarChart3, color: 'success' as const },
      { id: 'reports', label: 'dashboard.reports', icon: FileText, color: 'info' as const },
      { id: 'team', label: 'dashboard.team', icon: Users, color: 'coral' as const },
      { id: 'permissions', label: 'dashboard.permissions', icon: Settings, color: 'info' as const },
      { id: 'rag-management', label: 'dashboard.ragManagement', icon: Bot, color: 'info' as const }
    ]
  },
  newsfeed: {
    label: 'nav.newsfeed',
    icon: Rss,
    subTabs: [
      { id: 'feed', label: 'Feed', icon: Rss, color: 'coral' as const },
      { id: 'chat', label: 'AI Chat', icon: MessageSquare, color: 'info' as const }
    ]
  },
  policies: {
    label: 'nav.policies',
    icon: Shield,
    subTabs: [
      { id: 'documents', label: 'Documents', icon: FileText, color: 'success' as const },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, color: 'info' as const }
    ]
  },
  training: {
    label: 'nav.training',
    icon: GraduationCap,
    subTabs: [
      { id: 'profile', label: 'Profile', icon: Users, color: 'coral' as const },
      { id: 'courses', label: 'Courses', icon: BookOpen, color: 'info' as const },
      { id: 'management', label: 'Management', icon: Settings, color: 'coral' as const },
      { id: 'assignments', label: 'Assignments', icon: Target, color: 'info' as const }
    ]
  },
  assurance: {
    label: 'nav.assurance',
    icon: CheckCircle,
    subTabs: [
      { id: 'overview', label: 'dashboard.overview', icon: CheckCircle, color: 'success' as const },
      { id: 'feedback', label: 'Feedback & Complaints', icon: MessageSquare, color: 'info' as const }
    ]
  },
  announcements: {
    label: 'nav.announcements',
    icon: Rss,
    subTabs: []
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
    // Super admin sees everything
    if (isSuperAdmin) return true;

    // Staff view mode has its own set of rules
    if (viewMode === 'staff') {
      if (subTab.id === 'permissions') return false; // Never show permissions in staff view
      if (activeTab === 'training') {
        return subTab.id === 'profile' || subTab.id === 'courses';
      }
      if (activeTab === 'policies') {
        return true; // Show all policy sub-tabs in staff view
      }
      return true; // Show all other non-admin tabs
    }
    
    // Admin view mode rules
    if (isAdmin) {
       // Permissions sub-tab only for super admin
      if (subTab.id === 'permissions' && !isSuperAdmin) return false;
      return isSubTabEnabled(activeTab, subTab.id);
    }
    
    return true; // Default to showing the tab if no other rule applies
  });
  
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
              <Shield className="h-8 w-8 text-foreground" />
              <span className="text-xl font-bold text-foreground">{t('app.name')}</span>
            </div>
            
            <nav className="flex space-x-1">
              {(() => {
                const filteredTabs = Object.entries(tabConfig)
                  .filter(([key]) => {
                    // Check tab visibility configuration first
                    if (!tabVisibility[key as Tab]) {
                      console.log(`Tab ${key} hidden by tabVisibility config`);
                      return false;
                    }

                    // Show only policies, training, and announcements when in staff view mode
                    if (viewMode === 'staff' && !['policies', 'training', 'announcements'].includes(key)) {
                      console.log(`Tab ${key} hidden in staff view mode`);
                      return false;
                    }
                    console.log(`Tab ${key} is visible`);
                    return true;
                  });
                console.log('Visible tabs:', filteredTabs.map(([key]) => key));
                return filteredTabs;
              })().map(([key, config]) => {
                  const isActive = activeTab === key;
                  const Icon = config.icon;
                  
                  return (
                    <button
                      key={key}
                       onClick={() => {
                         console.log(`Tab clicked: ${key}`);
                         onTabChange(key as Tab);
                         if (key !== 'policies' && config.subTabs.length > 0) {
                          console.log(`Setting first sub-tab: ${config.subTabs[0].id}`);
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

      <div className="flex">
        {/* Left Sidebar - Hide for training tab since it has no sub-tabs */}
        {visibleSubTabs.length > 0 && (
          <aside className="w-64 border-r border-border bg-card">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wide mb-3">
                {t(tabConfig[activeTab].label)}
              </h3>
              <nav className="space-y-1">
                 {tabConfig[activeTab].subTabs
                  .filter((subTab) => {
                    // Super admin sees everything
                    if (isSuperAdmin) return true;
                    
                    // Permissions sub-tab only for super admin
                    if (subTab.id === 'permissions' && !isSuperAdmin) return false;
                    
                    // Regular admin sees based on permissions when in admin view
                    if (isAdmin && viewMode === 'admin') {
                      return isSubTabEnabled(activeTab, subTab.id);
                    }
                    
                    // Staff view filtering (applies to staff and admins in staff view)
                    if (!isAdmin || viewMode === 'staff') {
                      if (activeTab === 'training') {
                        // Staff can only see profile and courses in training
                        return subTab.id === 'profile' || subTab.id === 'courses';
                      }
                      if (activeTab === 'policies') {
                        // Show all policy sub-tabs in staff view
                        return true;
                      }
                      // For other tabs, show all sub-tabs
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
                        <span>{t(subTab.label)}</span>
                      </button>
                    );
                  })}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className={cn("flex-1", activeTab === 'policies' ? "p-0" : "p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}