import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import DashboardContent from '@/components/pages/DashboardContent';
import PoliciesContent from '@/components/pages/PoliciesContent';
import TrainingContent from '@/components/pages/TrainingContent';
import AssuranceContent from '@/components/pages/AssuranceContent';
import NewsfeedContent from '@/components/pages/NewsfeedContent';
import AnnouncementsContent from '@/components/pages/AnnouncementsContent';
import ProfileContent from '@/components/pages/ProfileContent';
import AdminContent from '@/components/pages/admin/AdminContent';

type Tab = 'dashboard' | 'newsfeed' | 'policies' | 'training' | 'assurance' | 'announcements' | 'admin' | 'profile';

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

const Index = () => {
  const { isAdmin, isSuperAdmin, viewMode } = useAuth();
  
  // Initialize state from localStorage if available
  const getInitialTab = (): Tab => {
    try {
      const savedTab = localStorage.getItem('activeTab');
      return (savedTab as Tab) || 'profile';
    } catch {
      return 'profile';
    }
  };

  const getInitialSubTab = (): string => {
    try {
      const savedSubTab = localStorage.getItem('activeSubTab');
      return savedSubTab || 'overview';
    } catch {
      return 'overview';
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab);
  const [activeSubTab, setActiveSubTab] = useState(getInitialSubTab);
  
  console.log('Index component rendering', { isAdmin, isSuperAdmin, viewMode, activeTab });

  const handleTabChange = (tab: Tab) => {
    console.log(`Index: Tab change requested: ${tab}`);
    setActiveTab(tab);
    // Persist to localStorage
    try {
      localStorage.setItem('activeTab', tab);
    } catch (error) {
      console.error('Failed to save tab to localStorage:', error);
    }
  };

  const handleSubTabChange = (subTab: string) => {
    console.log(`Index: Sub-tab change requested: ${subTab}`);
    setActiveSubTab(subTab);
    // Persist to localStorage
    try {
      localStorage.setItem('activeSubTab', subTab);
    } catch (error) {
      console.error('Failed to save sub-tab to localStorage:', error);
    }
  };

  // Check if current tab is visible and switch to first available if not
  useEffect(() => {
    const isTabVisible = (tab: Tab) => {
      // Check tab visibility configuration first
      if (!tabVisibility[tab]) {
        return false;
      }

      // Super admin only tab
      if (tab === 'admin' && !isSuperAdmin) {
        return false;
      }

      // Show only policies, training, profile, and announcements when in staff view mode
      if (viewMode === 'staff' && !['policies', 'training', 'profile', 'announcements'].includes(tab)) {
        return false;
      }

      return true;
    };

    if (!isTabVisible(activeTab)) {
      // Find the first visible tab
      const visibleTabs = Object.keys(tabVisibility).filter(tab => isTabVisible(tab as Tab)) as Tab[];
      if (visibleTabs.length > 0) {
        setActiveTab(visibleTabs[0]);
        // Update localStorage when switching to a valid tab
        try {
          localStorage.setItem('activeTab', visibleTabs[0]);
        } catch (error) {
          console.error('Failed to save tab to localStorage:', error);
        }
      }
    }
  }, [activeTab, viewMode, isSuperAdmin]);

  const renderContent = () => {
    console.log('renderContent called with activeTab:', activeTab);
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />;
      case 'newsfeed':
        return <NewsfeedContent activeSubTab={activeSubTab} />;
      case 'policies':
        return <PoliciesContent />;
      case 'training':
        return <TrainingContent activeSubTab={activeSubTab} />;
      case 'assurance':
        return <AssuranceContent />;
      case 'announcements':
        return <AnnouncementsContent />;
      case 'profile':
        console.log('Rendering ProfileContent');
        return <ProfileContent />;
      case 'admin':
        return <AdminContent activeSubTab={activeSubTab} />;
      default:
        return <DashboardContent activeSubTab={activeSubTab} onSubTabChange={handleSubTabChange} />;
    }
  };

  return (
    <MainLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      activeSubTab={activeSubTab}
      onSubTabChange={handleSubTabChange}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default Index;
