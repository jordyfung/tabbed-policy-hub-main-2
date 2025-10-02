import { useState } from 'react';
import { Bot, X } from 'lucide-react';
import ChatInterface from '@/components/ui/chat-interface';

export default function PoliciesContent() {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

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

      <button
        onClick={() => setIsAssistantOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center z-40"
        aria-label="Open AI assistant"
      >
        <Bot className="h-6 w-6" />
      </button>

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
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}