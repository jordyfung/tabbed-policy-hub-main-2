import { useState } from 'react';
import PermissionsContent from './PermissionsContent';
import RagManagementContent from './RagManagementContent';

interface AdminContentProps {
  activeSubTab?: string;
}

export default function AdminContent({ activeSubTab = 'permissions' }: AdminContentProps) {
  // Render content based on active sub-tab
  if (activeSubTab === 'permissions') {
    return <PermissionsContent />;
  }

  if (activeSubTab === 'rag-management') {
    return <RagManagementContent />;
  }

  // Default fallback
  return <PermissionsContent />;
}
