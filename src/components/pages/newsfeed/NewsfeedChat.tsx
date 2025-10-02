import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { Send, Bot, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function NewsfeedChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Hello! I'm your AI News Assistant. I can help you understand industry news, regulations, and compliance requirements. What would you like to know about?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: messages.length + 2,
        content: generateAIResponse(inputMessage),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (input: string): string => {
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('medication') || lowerInput.includes('drug')) {
      return "Based on the latest ACQSC guidelines, medication management requires strict documentation and dual verification for high-risk medications. The new standards emphasize electronic medication records and real-time monitoring. Would you like me to explain specific compliance requirements?";
    }
    
    if (lowerInput.includes('training') || lowerInput.includes('education')) {
      return "Current industry trends show a focus on competency-based training and continuous professional development. The government has allocated additional funding for aged care workforce development. I can help you understand the latest training requirements and available grants.";
    }
    
    if (lowerInput.includes('audit') || lowerInput.includes('compliance')) {
      return "The ACQSC has updated their audit methodology with increased focus on consumer outcomes and safety. Recent regulatory changes emphasize preventive care and quality indicators. Would you like a summary of the latest compliance requirements?";
    }
    
    if (lowerInput.includes('funding') || lowerInput.includes('grant')) {
      return "Several funding opportunities are currently available including workforce development grants and technology implementation subsidies. The application deadlines vary, but many close by January 31st. I can provide specific details about eligibility criteria.";
    }
    
    return "That's an interesting question about aged care. I have access to the latest industry news, regulations, and best practices. Could you be more specific about what aspect you'd like to explore? I can help with compliance, training, funding opportunities, or operational guidelines.";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI News Assistant</h2>
          <p className="text-foreground/60">Chat with AI about industry news and compliance</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Powered by AI</span>
        </div>
      </div>

      {/* Chat Interface */}
      <Card className="flex flex-col h-[700px]">
        {/* Chat Header */}
        <div className="p-6 border-b border-border bg-muted/30">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <span className="h-6 w-6 flex items-center justify-center text-2xl">👾</span>
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">AI News Assistant</p>
              <p className="text-sm text-muted-foreground">Online • Specialized in Aged Care</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex space-x-3 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className={message.sender === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}>
                    {message.sender === 'ai' ? (
                      <span className="h-5 w-5 flex items-center justify-center text-2xl">👾</span>
                    ) : (
                      profile?.first_name?.[0] || 'U'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className={`rounded-xl px-4 py-3 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted border'
                }`}>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    message.sender === 'user' 
                      ? 'text-primary-foreground/70' 
                      : 'text-muted-foreground'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex space-x-3 max-w-[85%]">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <span className="h-5 w-5 flex items-center justify-center text-2xl">👾</span>
                  </AvatarFallback>
                </Avatar>
                <div className="rounded-xl px-4 py-3 bg-muted border">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-6 border-t border-border bg-muted/20">
          <div className="flex space-x-3">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about industry news, compliance, or regulations..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isTyping}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || isTyping}
              size="default"
              className="px-6"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}