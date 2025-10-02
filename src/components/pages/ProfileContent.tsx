import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import ViewProfileModal from '@/components/ui/modals/ViewProfileModal';
import UpdatePhotoModal from '@/components/ui/modals/UpdatePhotoModal';
import AIService, { ChatMessage } from '@/services/aiService';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Award, 
  BookOpen, 
  Clock,
  MapPin,
  Briefcase,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  FileText,
  Shield,
  X
} from 'lucide-react';

interface ProfileData {
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
  phone?: string;
  department?: string;
  job_title?: string;
}

interface TrainingSummary {
  completed_courses: number;
  total_courses: number;
  recent_completions: Array<{
    title: string;
    completed_at: string;
    score?: number;
  }>;
}

interface EmployeeProfile {
  id: string;
  user_id: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export default function ProfileContent() {
  const { t } = useTranslation();
  const { profile, refetchProfile } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [trainingSummary, setTrainingSummary] = useState<TrainingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('ProfileContent rendering', { profile, loading });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  
  // AI Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isChatActive, setIsChatActive] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile | null>(null);
  const [showPrivacyNote, setShowPrivacyNote] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiService = AIService.getInstance();

  useEffect(() => {
    if (profile) {
      fetchProfileData();
      fetchTrainingSummary();
      fetchEmployeeProfile();
    }
  }, [profile]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Auto-focus input when chat becomes active or after AI responds
  useEffect(() => {
    if (isChatActive && !isAILoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatActive, isAILoading]);

  const fetchProfileData = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (error) {
        console.error('Error fetching profile data:', error);
        return;
      }

      setProfileData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const fetchTrainingSummary = async () => {
    if (!profile) return;

    try {
      // Fetch completed courses
      const { data: completions, error: completionsError } = await supabase
        .from('course_completions')
        .select(`
          completed_at,
          score,
          course_assignments!inner(
            course:courses(title)
          )
        `)
        .eq('completed_by', profile.user_id)
        .order('completed_at', { ascending: false })
        .limit(5);

      if (completionsError) {
        console.error('Error fetching training summary:', completionsError);
        return;
      }

      // Fetch total assigned courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from('course_assignments')
        .select('id')
        .eq('assigned_to', profile.user_id);

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError);
        return;
      }

      setTrainingSummary({
        completed_courses: completions?.length || 0,
        total_courses: assignments?.length || 0,
        recent_completions: completions?.map(completion => ({
          title: (completion as any).course_assignments?.course?.title || 'Unknown Course',
          completed_at: completion.completed_at,
          score: completion.score
        })) || []
      });
    } catch (error) {
      console.error('Error fetching training summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  const getPhotoUrl = (url?: string | null) => {
    if (!url) return '';
    // Add cache-busting timestamp to force reload after upload
    return `${url}?t=${Date.now()}`;
  };

  const refetchProfileData = async () => {
    await refetchProfile();
    if (profile) {
      fetchProfileData();
      fetchEmployeeProfile();
    }
  };

  const fetchEmployeeProfile = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('employee_profiles')
        .select('*')
        .eq('user_id', profile.user_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching employee profile:', error);
        return;
      }

      setEmployeeProfile(data);
    } catch (error) {
      console.error('Error fetching employee profile:', error);
    }
  };

  const startChat = () => {
    setIsChatActive(true);
    setChatMessages([]);
    setShowPrivacyNote(true);
  };

  const endChat = async () => {
    if (chatMessages.length === 0) {
      setIsChatActive(false);
      return;
    }

    setIsAILoading(true);
    try {
      // Check if profile exists and get its ID and current summary
      const { data: existingProfile } = await supabase
        .from('employee_profiles')
        .select('id, summary')
        .eq('user_id', profile!.user_id)
        .single();

      // Summarize the conversation, merging with existing summary if available
      const existingSummary = existingProfile?.summary;
      const mergedSummary = await aiService.summarizeConversation(
        chatMessages, 
        existingSummary
      );
      
      // Prepare upsert data
      const profileData: any = {
        user_id: profile!.user_id,
        summary: mergedSummary,
        updated_at: new Date().toISOString()
      };

      // If profile exists, include its ID for proper update
      if (existingProfile) {
        profileData.id = existingProfile.id;
      }

      // Save to database with proper conflict resolution
      const { error } = await supabase
        .from('employee_profiles')
        .upsert(profileData, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving employee profile:', error);
        toast({
          title: "Error",
          description: "Failed to save your work profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Refresh the profile
      await fetchEmployeeProfile();
      
      // Show success message with context
      const isUpdate = !!existingSummary;
      toast({
        title: isUpdate ? "Profile Enhanced" : "Profile Created",
        description: isUpdate 
          ? "Your work profile has been updated with new insights!"
          : "Your work profile has been successfully created!",
      });
    } catch (error) {
      console.error('Error ending chat:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAILoading(false);
      setIsChatActive(false);
      setChatMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isAILoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: currentMessage.trim()
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setCurrentMessage('');
    setIsAILoading(true);

    try {
      const aiResponse = await aiService.getChatResponse(newMessages);
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse
      };
      setChatMessages([...newMessages, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="h-64 bg-muted rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add a fallback for when profile is null
  if (!profile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-foreground/60 mt-2">Loading your profile...</p>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground/60">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
          <p className="text-foreground/60 mt-2">{t('profile.subtitle')}</p>
        </div>
        <Card className="p-6">
          <p className="text-foreground/60">{t('profile.errorLoading')}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{t('profile.title')}</h1>
        <p className="text-foreground/60 mt-2">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Information */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Header Card */}
            <Card className="md:col-span-1 p-6">
          <div className="flex flex-col items-center text-center space-y-4">
            <button
              onClick={() => setPhotoModalOpen(true)}
              className="relative group cursor-pointer rounded-full transition-all hover:opacity-80"
            >
              <Avatar className="h-24 w-24">
                <AvatarImage src={getPhotoUrl(profile?.photo_url)} alt={`${profileData.first_name} ${profileData.last_name}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {getInitials(profileData.first_name, profileData.last_name)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <User className="h-8 w-8 text-white" />
              </div>
            </button>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                {profileData.first_name} {profileData.last_name}
              </h2>
              <Badge variant="outline" className="capitalize">
                {profileData.role}
              </Badge>
              <p className="text-sm text-foreground/60">{profileData.email}</p>
            </div>

            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
              <User className="h-4 w-4 mr-2" />
              {t('profile.editProfile')}
            </Button>
          </div>
        </Card>

            {/* Profile Details */}
            <Card className="md:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{t('profile.personalInfo')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-foreground/60" />
              <div>
                <p className="text-sm text-foreground/60">{t('profile.email')}</p>
                <p className="font-medium">{profileData.email}</p>
              </div>
            </div>

            {profileData.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-foreground/60" />
                <div>
                  <p className="text-sm text-foreground/60">{t('profile.phone')}</p>
                  <p className="font-medium">{profileData.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-foreground/60" />
              <div>
                <p className="text-sm text-foreground/60">{t('profile.memberSince')}</p>
                <p className="font-medium">{formatDate(profileData.created_at)}</p>
              </div>
            </div>

            {profileData.department && (
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-foreground/60" />
                <div>
                  <p className="text-sm text-foreground/60">{t('profile.department')}</p>
                  <p className="font-medium">{profileData.department}</p>
                </div>
              </div>
            )}

            {profileData.job_title && (
              <div className="flex items-center space-x-3">
                <Briefcase className="h-4 w-4 text-foreground/60" />
                <div>
                  <p className="text-sm text-foreground/60">{t('profile.jobTitle')}</p>
                  <p className="font-medium">{profileData.job_title}</p>
                </div>
              </div>
            )}
          </div>
        </Card>
          </div>

          {/* Work Profile Summary - Left Column */}
          {employeeProfile && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Work Profile Summary</h3>
                </div>
                <Button 
                  onClick={startChat} 
                  variant="ghost" 
                  size="sm"
                  className="text-primary hover:text-primary/80"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
              <div className="p-5 bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border border-muted">
                <div className="prose prose-sm dark:prose-invert max-w-none
                  prose-headings:text-foreground prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2 first:prose-headings:mt-0
                  prose-p:text-foreground/80 prose-p:leading-relaxed prose-p:my-2
                  prose-strong:text-foreground prose-strong:font-semibold
                  prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
                  prose-li:text-foreground/80 prose-li:my-1">
                  <ReactMarkdown>
                    {employeeProfile.summary}
                  </ReactMarkdown>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-foreground/60 mt-3">
                <span>Last updated: {formatDate(employeeProfile.updated_at)}</span>
              </div>
            </Card>
          )}

          {/* Training Summary */}
          {trainingSummary && (
            <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">{t('profile.trainingSummary')}</h3>
            <Badge variant="outline">
              {trainingSummary.completed_courses} / {trainingSummary.total_courses} {t('profile.coursesCompleted')}
            </Badge>
          </div>

          {trainingSummary.recent_completions.length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">{t('profile.recentCompletions')}</h4>
              {trainingSummary.recent_completions.map((completion, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Award className="h-4 w-4 text-success" />
                    <div>
                      <p className="font-medium">{completion.title}</p>
                      <p className="text-sm text-foreground/60">
                        {t('profile.completedOn')} {formatDate(completion.completed_at)}
                      </p>
                    </div>
                  </div>
                  {completion.score && (
                    <Badge variant="outline">
                      {completion.score}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-foreground/40 mx-auto mb-4" />
              <p className="text-foreground/60">{t('profile.noTrainingHistory')}</p>
            </div>
          )}
            </Card>
          )}
        </div>

        {/* Right Column - AI Chat Sidebar (ChatGPT-inspired) */}
        <div className="lg:col-span-1">
          <Card className="p-0 lg:sticky lg:top-6 overflow-hidden border-0 shadow-lg">
            {isChatActive ? (
              <div className="flex flex-col h-[calc(100vh-8rem)]">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="h-5 w-5 flex items-center justify-center text-2xl">👾</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">AI Assistant</h3>
                      <p className="text-xs text-muted-foreground">Here to understand your preferences</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {/* Privacy Notice - Inline style */}
                    {showPrivacyNote && (
                      <div className="flex items-start space-x-2 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                        <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-blue-700 dark:text-blue-300 flex-1">
                          Your responses are stored securely to help us understand your preferences better.
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPrivacyNote(false)}
                          className="h-5 w-5 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {chatMessages.length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-4">
                          <span className="h-8 w-8 flex items-center justify-center text-3xl">👾</span>
                        </div>
                        <h4 className="font-medium text-foreground mb-2">Let's get started!</h4>
                        <p className="text-sm text-muted-foreground">
                          Just type a message below to begin.
                        </p>
                      </div>
                    )}
                    
                    {chatMessages.map((message, index) => (
                      <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            message.role === 'user' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-gradient-to-br from-primary/20 to-primary/5'
                          }`}>
                            {message.role === 'user' ? (
                              <UserIcon className="h-4 w-4" />
                            ) : (
                              <span className="h-4 w-4 flex items-center justify-center text-lg">👾</span>
                            )}
                          </div>
                          <div className={`px-4 py-3 rounded-2xl ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-tr-sm'
                              : 'bg-muted text-foreground rounded-tl-sm'
                          }`}>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isAILoading && (
                      <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex gap-3 max-w-[85%]">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                            <span className="h-4 w-4 flex items-center justify-center text-lg">👾</span>
                          </div>
                          <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-muted">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Input Area - ChatGPT style */}
                <div className="p-4 border-t bg-background">
                  <div className="relative">
                    <Input
                      ref={inputRef}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Message AI Assistant..."
                      disabled={isAILoading}
                      className="pr-12 py-6 rounded-2xl border-2 focus:border-primary transition-colors"
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!currentMessage.trim() || isAILoading}
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl h-8 w-8 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-xs text-muted-foreground">
                      Press Enter to send
                    </p>
                    <Button 
                      onClick={endChat} 
                      variant="ghost" 
                      size="sm"
                      disabled={isAILoading}
                      className="text-xs"
                    >
                      {isAILoading ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FileText className="h-3 w-3 mr-1" />
                          Save Profile
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6">
                {/* Welcome State - Inviting design */}
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-500">
                    <span className="h-10 w-10 flex items-center justify-center text-4xl">👾</span>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">
                    {employeeProfile ? "Update Your Profile" : "Build Your Work Profile"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
                    {employeeProfile 
                      ? "Start a conversation to refine your work preferences and help us support you better."
                      : "Chat with our AI to share your work style, preferences, and what makes you thrive at work."
                    }
                  </p>
                  
                  {/* Quick prompts - ChatGPT style */}
                  <div className="space-y-2 mb-6">
                    <button
                      onClick={startChat}
                      className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">Tell me about your ideal work environment</span>
                      </div>
                    </button>
                    <button
                      onClick={startChat}
                      className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">How do you prefer to communicate?</span>
                      </div>
                    </button>
                    <button
                      onClick={startChat}
                      className="w-full p-3 text-left text-sm bg-muted/50 hover:bg-muted rounded-xl transition-colors border border-transparent hover:border-primary/20"
                    >
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-foreground/80">What motivates you at work?</span>
                      </div>
                    </button>
                  </div>

                  <Button onClick={startChat} size="lg" className="rounded-2xl px-8">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {employeeProfile ? "Start New Conversation" : "Let's Get Started"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ViewProfileModal 
        open={editModalOpen} 
        onOpenChange={setEditModalOpen}
        onSaved={refetchProfileData}
      />

      <UpdatePhotoModal 
        open={photoModalOpen} 
        onOpenChange={setPhotoModalOpen}
        onSaved={refetchProfileData}
      />
    </div>
  );
}
