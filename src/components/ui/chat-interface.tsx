import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, ExternalLink, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RAGService, RAGResponse } from '@/services/ragService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  sources?: RAGResponse['sources'];
  confidence?: RAGResponse['confidence'];
  processingTime?: number;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your compliance AI assistant. I can help you with policy questions, regulatory requirements, and compliance guidance based on your organization\'s policy documents. How can I assist you today?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [systemReady, setSystemReady] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ragService = new RAGService();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Check if RAG system is ready on component mount
    const checkSystemReady = async () => {
      try {
        const ready = await ragService.isSystemReady();
        setSystemReady(ready);
      } catch (error) {
        console.error('Error checking system readiness:', error);
        setSystemReady(false);
      }
    };

    checkSystemReady();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Use RAG service to get response
      const ragResponse: RAGResponse = await ragService.askQuestion(userMessage.content);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: ragResponse.answer,
        sender: 'ai',
        timestamp: new Date(),
        sources: ragResponse.sources,
        confidence: ragResponse.confidence,
        processingTime: ragResponse.processingTime
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting RAG response:', error);

      // Fallback error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I am experiencing technical difficulties. Please try again later or consult the policy documents directly.',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };


  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Chat Header */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <span className="h-5 w-5 flex items-center justify-center text-2xl">👾</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">AI Compliance Assistant</h2>
              <p className="text-sm text-foreground/60">Ask me anything about policies and compliance</p>
            </div>
          </div>

          {/* System Status Indicator */}
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              systemReady === true
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : systemReady === false
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                systemReady === true
                  ? 'bg-green-500'
                  : systemReady === false
                  ? 'bg-yellow-500'
                  : 'bg-gray-500'
              }`} />
              <span>
                {systemReady === true
                  ? 'Ready'
                  : systemReady === false
                  ? 'Sync Needed'
                  : 'Checking...'
                }
              </span>
            </div>
          </div>
        </div>

        {/* System Status Alert */}
        {systemReady === false && (
          <Alert className="mt-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The AI assistant needs policy documents to be synchronized. Please contact an administrator to set up the knowledge base.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-start space-x-3 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
              <div className={`p-2 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-primary/10' 
                  : 'bg-muted'
              }`}>
                {message.sender === 'user' ? (
                  <User className="h-4 w-4 text-primary" />
                ) : (
                  <span className="h-4 w-4 flex items-center justify-center text-lg">👾</span>
                )}
              </div>
              
              <div className="flex-1">
                <Card className={`p-4 ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className={`text-xs mt-2 ${
                    message.sender === 'user'
                      ? 'text-primary-foreground/70'
                      : 'text-foreground/50'
                  }`}>
                    {formatTime(message.timestamp)}
                    {message.processingTime && (
                      <span className="ml-2">
                        ({message.processingTime}ms)
                      </span>
                    )}
                  </div>
                </Card>

                {/* Show sources and confidence for AI messages */}
                {message.sender === 'ai' && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <span className="text-xs text-foreground/70">
                          Confidence: {message.confidence}
                        </span>
                      </div>
                      <span className="text-xs text-foreground/50">
                        {message.sources.length} source{message.sources.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {message.sources.slice(0, 3).map((source, index) => (
                        <div key={source.id} className="text-xs bg-muted/50 rounded px-2 py-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate flex-1 mr-2">
                              {source.title}
                            </span>
                            <a
                              href={source.metadata?.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                              title="View in Notion"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {message.sources.length > 3 && (
                        <div className="text-xs text-foreground/50 px-2">
                          +{message.sources.length - 3} more sources
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-3 max-w-[80%]">
              <div className="p-2 rounded-lg bg-muted">
                <span className="h-4 w-4 flex items-center justify-center text-lg">👾</span>
              </div>
              <Card className="p-4 bg-card">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-card px-6 py-4">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about compliance policies, regulations, or procedures..."
              className="min-h-[40px] max-h-[120px] resize-none border-input"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2 h-auto"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-foreground/50 mt-2">
          Press Enter to send, Shift + Enter for new line
        </p>
      </div>
    </div>
  );
}