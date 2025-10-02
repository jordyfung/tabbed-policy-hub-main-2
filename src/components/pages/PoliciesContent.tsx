import { useState, useEffect } from 'react';
import { Bot, X, ExternalLink } from 'lucide-react';
import ChatInterface from '@/components/ui/chat-interface';
import ChatInterfaceImproved from '@/components/ui/chat-interface-improved';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';

export default function PoliciesContent() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [shouldBounce, setShouldBounce] = useState(false);
  const { isAdmin, viewMode } = useAuth();

  // Trigger bounce animation every 10 seconds
  useEffect(() => {
    const bounceInterval = setInterval(() => {
      setShouldBounce(true);
      setTimeout(() => setShouldBounce(false), 600); // Duration matches animation
    }, 10000);

    return () => clearInterval(bounceInterval);
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)' }}>
      <iframe
        src="https://cyber-mosquito-7ab.notion.site/ebd/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd&pvs=4"
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        className="w-full h-full border-0"
        title="Policy Documents"
      />

      {/* Bottom Right Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-row-reverse items-center gap-3">
        {/* AI Assistant Button */}
        <button
          onClick={() => setIsAssistantOpen(true)}
          className={`h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center ${
            shouldBounce ? 'animate-attention-bounce' : ''
          }`}
          aria-label="Open AI assistant"
        >
          <span className="h-6 w-6 flex items-center justify-center text-2xl">👾</span>
        </button>

        {/* Admin Edit Policies Button - Only show in admin view mode */}
        {isAdmin && viewMode === 'admin' && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => window.open('https://www.notion.so/21c0332ab27a804d8a58f96e177bce74?v=2690332ab27a8017aab2000c717949cd&source=copy_link', '_blank')}
                  className="shadow-lg"
                  size="default"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Edit Policies
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">
                  Edit policies directly in Notion or leave a comment for Jordy to review and sign off.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {isAssistantOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsAssistantOpen(false)} />
          <div className="absolute bottom-6 right-6 w-[min(420px,100vw-24px)] h-[min(70vh,calc(100vh-96px))] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="absolute top-2 right-2 z-10">
              <button
                className="p-2 rounded-md hover:bg-muted"
                onClick={() => setIsAssistantOpen(false)}
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="w-full h-full">
              <ChatInterfaceImproved />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}