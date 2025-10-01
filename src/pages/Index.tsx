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

type Tab = 'dashboard' | 'newsfeed' | 'policies' | 'training' | 'assurance' | 'announcements';

// Tab visibility configuration - set to false to hide tabs without deleting code
const tabVisibility: Record<Tab, boolean> = {
  dashboard: true,
  newsfeed: false,
  policies: true,
  training: true,
  assurance: true,
  announcements: false,
};

const Index = () => {
  const { isAdmin, viewMode } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('policies');
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const handleTabChange = (tab: Tab) => {
    console.log(`Index: Tab change requested: ${tab}`);
    setActiveTab(tab);
  };

  const handleSubTabChange = (subTab: string) => {
    console.log(`Index: Sub-tab change requested: ${subTab}`);
    setActiveSubTab(subTab);
  };

  // Check if current tab is visible and switch to first available if not
  useEffect(() => {
    const isTabVisible = (tab: Tab) => {
      // Check tab visibility configuration first
      if (!tabVisibility[tab]) {
        return false;
      }

      // Show only policies, training, and announcements when in staff view mode
      if (viewMode === 'staff' && !['policies', 'training', 'announcements'].includes(tab)) {
        return false;
      }

      return true;
    };

    if (!isTabVisible(activeTab)) {
      // Find the first visible tab
      const visibleTabs = Object.keys(tabVisibility).filter(tab => isTabVisible(tab as Tab)) as Tab[];
      if (visibleTabs.length > 0) {
        setActiveTab(visibleTabs[0]);
      }
    }
  }, [activeTab, viewMode]);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent activeSubTab={activeSubTab} />;
      case 'newsfeed':
        return <NewsfeedContent activeSubTab={activeSubTab} />;
      case 'policies':
        return <PoliciesContent />;
      case 'training':
        return <TrainingContent activeSubTab={activeSubTab} />;
      case 'assurance':
        return <AssuranceContent activeSubTab={activeSubTab} />;
      case 'announcements':
        return <AnnouncementsContent />;
      default:
        return <DashboardContent activeSubTab={activeSubTab} />;
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
