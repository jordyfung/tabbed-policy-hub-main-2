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
      { id: 'team', label: 'Team Management', icon: Users, color: 'coral' as const },
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
                      return false;
                    }

                    // Show only policies, training, and announcements when in staff view mode
                    if (viewMode === 'staff' && !['policies', 'training', 'announcements'].includes(key)) {
                      return false;
                    }
                    return true;
                  });
                return filteredTabs;
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

      <div className="flex">
        {/* Left Sidebar - Hide for training tab since it has no sub-tabs */}
        {visibleSubTabs.length > 0 && (
          <aside className="w-64 border-r border-border bg-card">
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
        <main className={cn("flex-1", activeTab === 'policies' ? "p-0" : "p-6")}>
          {children}
        </main>
      </div>
    </div>
  );
}