import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RAGServiceImproved } from '@/services/ragServiceImproved';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  confidence?: 'high' | 'medium' | 'low';
  processingTime?: number;
  sources?: Array<{
    title: string;
    notion_page_id: string;
    similarity: number;
  }>;
}

export default function ChatInterfaceImproved() {
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
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const ragService = new RAGServiceImproved();

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
        setError(null);
        const ready = await ragService.isSystemReady();
        setSystemReady(ready);
        
        if (!ready) {
          setError('RAG system is not ready. Please ensure policy documents have been synced.');
        }
      } catch (error) {
        console.error('Error checking system readiness:', error);
        setSystemReady(false);
        setError('Failed to check system status. Please try refreshing the page.');
      }
    };

    checkSystemReady();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setError(null);

    try {
      const response = await ragService.getResponseWithContext(inputValue.trim());
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response.answer,
        sender: 'ai',
        timestamp: new Date(),
        confidence: response.confidence,
        processingTime: response.processingTime,
        sources: response.sources.map(source => ({
          title: source.title,
          notion_page_id: source.notion_page_id,
          similarity: source.similarity
        }))
      };

      setMessages(prev => [...prev, aiMessage]);
      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to get response. Please try again.');
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
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

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    // Re-check system status
    const checkSystemReady = async () => {
      try {
        const ready = await ragService.isSystemReady();
        setSystemReady(ready);
        if (!ready) {
          setError('RAG system is still not ready. Please contact an administrator to sync policy documents.');
        }
      } catch (error) {
        setError('Failed to check system status. Please try refreshing the page.');
      }
    };
    checkSystemReady();
  };

  const getConfidenceColor = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getConfidenceText = (confidence?: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'High Confidence';
      case 'medium': return 'Medium Confidence';
      case 'low': return 'Low Confidence';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <span className="h-5 w-5 flex items-center justify-center text-2xl">👾</span>
          <h3 className="font-semibold text-foreground">Compliance Assistant</h3>
          {systemReady !== null && (
            <div className={`ml-auto text-xs px-2 py-1 rounded ${
              systemReady ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {systemReady ? 'Ready' : 'Not Ready'}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] rounded-lg p-3 ${
              message.sender === 'user'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground'
            }`}>
              <div className="flex items-start space-x-2">
                {message.sender === 'ai' && <span className="h-4 w-4 flex items-center justify-center text-lg mt-0.5 flex-shrink-0">👾</span>}
                {message.sender === 'user' && <User className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* AI Message Metadata */}
                  {message.sender === 'ai' && (
                    <div className="mt-2 space-y-1">
                      {message.confidence && (
                        <div className={`text-xs ${getConfidenceColor(message.confidence)}`}>
                          {getConfidenceText(message.confidence)}
                        </div>
                      )}
                      
                      {message.processingTime && (
                        <div className="text-xs text-muted-foreground">
                          Processed in {message.processingTime}ms
                        </div>
                      )}
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Sources: {message.sources.length} policy document(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted text-foreground rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <span className="h-4 w-4 flex items-center justify-center text-lg">👾</span>
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about policies, procedures, or compliance requirements..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={isTyping || systemReady === false}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping || systemReady === false}
            className="px-4"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {systemReady === false && (
          <p className="text-xs text-muted-foreground mt-2">
            System not ready. Please ensure policy documents are synced.
          </p>
        )}
      </div>
    </div>
  );
}
