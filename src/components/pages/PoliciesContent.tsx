import { useAuth } from '@/hooks/useAuth';
import ChatInterface from '@/components/ui/chat-interface';
import FeedbackContent from './policies/FeedbackContent';
import ViewFeedbackContent from './policies/ViewFeedbackContent';

interface PoliciesContentProps {
  activeSubTab?: string;
}

export default function PoliciesContent({ activeSubTab = 'documents' }: PoliciesContentProps) {
  const { isAdmin, viewMode } = useAuth();

  const renderContent = () => {
    switch (activeSubTab) {
      case 'ai-assistant':
        return (
          <div className="h-full" style={{ height: 'calc(100vh - 200px)' }}>
            <ChatInterface />
          </div>
        );
      case 'feedback':
        return <FeedbackContent />;
      case 'view-feedback':
        return isAdmin && viewMode === 'admin' ? <ViewFeedbackContent /> : null;
      case 'documents':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Documents</h1>
              <p className="text-foreground/60 mt-2">Access and manage your organization's policy documentation</p>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src="https://cyber-mosquito-7ab.notion.site/ebd/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd"
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full border-0"
                title="Policy Documents"
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Policy Documents</h1>
              <p className="text-foreground/60 mt-2">Access and manage your organization's policy documentation</p>
            </div>

            <div className="bg-card rounded-lg border border-border overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
              <iframe
                src="https://cyber-mosquito-7ab.notion.site/ebd/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd"
                width="100%"
                height="600"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full border-0"
                title="Policy Documents"
              />
            </div>
          </div>
        );
    }
  };

  return renderContent();
}