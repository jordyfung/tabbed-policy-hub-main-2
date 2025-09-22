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

const Index = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent activeSubTab={activeSubTab} />;
      case 'newsfeed':
        return <NewsfeedContent activeSubTab={activeSubTab} />;
      case 'policies':
        return <PoliciesContent activeSubTab={activeSubTab} />;
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
      onTabChange={setActiveTab}
      activeSubTab={activeSubTab}
      onSubTabChange={setActiveSubTab}
    >
      {renderContent()}
    </MainLayout>
  );
};

export default Index;
