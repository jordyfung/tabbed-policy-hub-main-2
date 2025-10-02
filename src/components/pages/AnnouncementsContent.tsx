import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Megaphone, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  AlertTriangle,
  Info,
  Plus,
  Send,
  Eye,
  Users,
  Filter,
  Search,
  MessageCircle // For comments icon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface PollOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  expiresAt?: string;
  allowMultipleVotes: boolean;
  totalVotes: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  date: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  isAcknowledged: boolean;
  acknowledgedBy: string[];
  acknowledgedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  poll?: Poll;
}

const mockAnnouncements: Announcement[] = [
  {
    id: 'ANN001',
    title: 'New Medication Administration Protocol',
    content: 'Please review the updated medication administration protocol effective immediately. All staff must complete the updated training module by Friday. This includes new documentation requirements and double-check procedures.',
    author: 'Dr. Sarah Mitchell',
    authorRole: 'Director of Nursing',
    date: '2024-01-23',
    priority: 'high',
    category: 'Clinical Updates',
    isAcknowledged: false,
    acknowledgedBy: ['jane.doe@example.com', 'john.smith@example.com'],
    expiresAt: '2024-01-30',
    isActive: true
  },
  {
    id: 'ANN002',
    title: 'Staff Meeting - Friday 2:00 PM',
    content: 'Monthly staff meeting scheduled for Friday at 2:00 PM in the conference room. Agenda includes Q1 performance review, new resident care plans, and facility updates. Attendance is mandatory for all nursing staff.',
    author: 'Dr. Sarah Mitchell',
    authorRole: 'Director of Nursing',
    date: '2024-01-22',
    priority: 'medium',
    category: 'Staff Meetings',
    isAcknowledged: true,
    acknowledgedBy: ['Current User', 'emily.white@example.com'],
    acknowledgedAt: '2024-01-22',
    expiresAt: '2024-01-26',
    isActive: true
  },
  {
    id: 'ANN003',
    title: 'Infection Control Reminder',
    content: 'With flu season approaching, please ensure all infection control protocols are strictly followed. Hand hygiene stations are being monitored, and additional PPE supplies are available in the storage room.',
    author: 'Dr. Sarah Mitchell',
    authorRole: 'Director of Nursing',
    date: '2024-01-21',
    priority: 'medium',
    category: 'Safety & Compliance',
    isAcknowledged: false,
    acknowledgedBy: ['mark.brown@example.com'],
    expiresAt: '2024-02-21',
    isActive: true
  },
  {
    id: 'ANN004',
    title: 'New Resident Welcome - Room 205',
    content: 'We are welcoming Mrs. Johnson to Room 205 today. Please review her care plan and ensure all necessary equipment is in place. Family will be visiting this afternoon.',
    author: 'Dr. Sarah Mitchell',
    authorRole: 'Director of Nursing',
    date: '2024-01-20',
    priority: 'low',
    category: 'Resident Updates',
    isAcknowledged: true,
    acknowledgedBy: ['Current User'],
    acknowledgedAt: '2024-01-20',
    isActive: false
  },
  {
    id: 'ANN005',
    title: 'Staff Training Preferences Survey',
    content: 'We are planning our Q2 training schedule and would like your input on preferred training topics. Your feedback will help us prioritize the most valuable training sessions.',
    author: 'Dr. Sarah Mitchell',
    authorRole: 'Director of Nursing',
    date: '2024-01-24',
    priority: 'medium',
    category: 'Staff Development',
    isAcknowledged: false,
    acknowledgedBy: ['jane.doe@example.com'],
    expiresAt: '2024-02-01',
    isActive: true,
    poll: {
      id: 'POLL001',
      question: 'Which training topic would be most valuable for you?',
      options: [
        {
          id: 'OPT0',
          text: 'Advanced Wound Care Techniques',
          votes: 3,
          voters: ['jane.doe@example.com', 'john.smith@example.com', 'emily.white@example.com']
        },
        {
          id: 'OPT1',
          text: 'Medication Management & Safety',
          votes: 2,
          voters: ['mark.brown@example.com', 'Current User']
        },
        {
          id: 'OPT2',
          text: 'Communication with Families',
          votes: 1,
          voters: ['sarah.jones@example.com']
        },
        {
          id: 'OPT3',
          text: 'Emergency Response Protocols',
          votes: 4,
          voters: ['jane.doe@example.com', 'john.smith@example.com', 'emily.white@example.com', 'mark.brown@example.com']
        }
      ],
      isActive: true,
      expiresAt: '2024-02-01',
      allowMultipleVotes: true,
      totalVotes: 10
    }
  }
];

export default function AnnouncementsContent() {
  const { profile, isAdmin, viewMode } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Form state for creating new announcements
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'medium' as Announcement['priority'],
    category: '',
    expiresAt: '',
    includePoll: false,
    pollQuestion: '',
    pollOptions: ['', ''],
    pollExpiresAt: '',
    allowMultipleVotes: false
  });

  const filteredAnnouncements = announcements.filter(item => {
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesPriority && matchesCategory && matchesSearch;
  });

  const handleAcknowledge = (announcementId: string) => {
    const currentUser = profile?.email || 'Current User';
    const now = new Date().toISOString().split('T')[0];

    setAnnouncements(prev => prev.map(item => 
      item.id === announcementId 
        ? { 
            ...item, 
            isAcknowledged: true,
            acknowledgedBy: [...item.acknowledgedBy, currentUser],
            acknowledgedAt: now
          }
        : item
    ));
  };

  const handlePollVote = (announcementId: string, optionId: string) => {
    const currentUser = profile?.email || 'Current User';
    
    setAnnouncements(prev => prev.map(item => {
      if (item.id !== announcementId || !item.poll) return item;
      
      const poll = item.poll;
      const option = poll.options.find(opt => opt.id === optionId);
      if (!option) return item;
      
      // Check if user already voted for this option
      if (option.voters.includes(currentUser)) return item;
      
      // If not allowing multiple votes, remove user from all other options
      if (!poll.allowMultipleVotes) {
        poll.options.forEach(opt => {
          if (opt.id !== optionId && opt.voters.includes(currentUser)) {
            opt.votes--;
            opt.voters = opt.voters.filter(voter => voter !== currentUser);
          }
        });
      }
      
      // Add vote to selected option
      option.votes++;
      option.voters.push(currentUser);
      
      // Update total votes
      poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
      
      return {
        ...item,
        poll: { ...poll }
      };
    }));
  };

  const handleCreateAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) return;
    if (newAnnouncement.includePoll && (!newAnnouncement.pollQuestion.trim() || newAnnouncement.pollOptions.filter(opt => opt.trim()).length < 2)) return;

    const announcement: Announcement = {
      id: `ANN${Date.now()}`,
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      author: profile?.email || 'Current User',
      authorRole: 'Director of Nursing',
      date: new Date().toISOString().split('T')[0],
      priority: newAnnouncement.priority,
      category: newAnnouncement.category,
      isAcknowledged: false,
      acknowledgedBy: [],
      expiresAt: newAnnouncement.expiresAt || undefined,
      isActive: true,
      poll: newAnnouncement.includePoll ? {
        id: `POLL${Date.now()}`,
        question: newAnnouncement.pollQuestion,
        options: newAnnouncement.pollOptions
          .filter(opt => opt.trim())
          .map((opt, index) => ({
            id: `OPT${index}`,
            text: opt.trim(),
            votes: 0,
            voters: []
          })),
        isActive: true,
        expiresAt: newAnnouncement.pollExpiresAt || undefined,
        allowMultipleVotes: newAnnouncement.allowMultipleVotes,
        totalVotes: 0
      } : undefined
    };

    setAnnouncements(prev => [announcement, ...prev]);
    setNewAnnouncement({ 
      title: '', 
      content: '', 
      priority: 'medium', 
      category: '', 
      expiresAt: '',
      includePoll: false,
      pollQuestion: '',
      pollOptions: ['', ''],
      pollExpiresAt: '',
      allowMultipleVotes: false
    });
    setShowCreateForm(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const stats = {
    total: announcements.length,
    unacknowledged: announcements.filter(a => !a.isAcknowledged).length,
    urgent: announcements.filter(a => a.priority === 'urgent' && a.isActive).length,
    active: announcements.filter(a => a.isActive).length
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-foreground/60 mt-2">Important updates and communications from the Director of Nursing</p>
        </div>
        {isAdmin && viewMode === 'admin' && !showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Announcement
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      {isAdmin && viewMode === 'admin' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Total</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
                <Megaphone className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Unacknowledged</p>
                  <p className="text-xl font-bold text-foreground">{stats.unacknowledged}</p>
                </div>
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Urgent</p>
                  <p className="text-xl font-bold text-foreground">{stats.urgent}</p>
                </div>
                <AlertTriangle className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Active</p>
                  <p className="text-xl font-bold text-foreground">{stats.active}</p>
                </div>
                <CheckCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Announcement Form */}
      {showCreateForm && isAdmin && viewMode === 'admin' && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Create New Announcement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                value={newAnnouncement.title}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Announcement Title..."
                className="text-lg font-semibold border-0 focus-visible:ring-0 px-2"
              />
            </div>
            
            <div>
              <Textarea
                value={newAnnouncement.content}
                onChange={(e) => setNewAnnouncement(prev => ({ ...prev, content: e.target.value }))}
                placeholder="What's on your mind?"
                rows={4}
                className="border-0 focus-visible:ring-0 px-2"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <Label htmlFor="priority" className="text-xs">Priority</Label>
                <select
                  id="priority"
                  value={newAnnouncement.priority}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, priority: e.target.value as Announcement['priority'] }))}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <Label htmlFor="category" className="text-xs">Category</Label>
                <Input
                  id="category"
                  value={newAnnouncement.category}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="e.g., Clinical Updates"
                  className="mt-1 bg-background"
                />
              </div>

              <div>
                <Label htmlFor="expiresAt" className="text-xs">Expires At (Optional)</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={newAnnouncement.expiresAt}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="mt-1 bg-background"
                />
              </div>
            </div>

            {/* Poll Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  id="includePoll"
                  checked={newAnnouncement.includePoll}
                  onChange={(e) => setNewAnnouncement(prev => ({ ...prev, includePoll: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="includePoll" className="text-sm font-medium">Include a poll</Label>
              </div>

              {newAnnouncement.includePoll && (
                <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <Label htmlFor="pollQuestion" className="text-xs">Poll Question</Label>
                    <Input
                      id="pollQuestion"
                      value={newAnnouncement.pollQuestion}
                      onChange={(e) => setNewAnnouncement(prev => ({ ...prev, pollQuestion: e.target.value }))}
                      placeholder="What would you like to ask?"
                      className="mt-1 bg-background"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Poll Options</Label>
                    <div className="space-y-2 mt-1">
                      {newAnnouncement.pollOptions.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...newAnnouncement.pollOptions];
                              newOptions[index] = e.target.value;
                              setNewAnnouncement(prev => ({ ...prev, pollOptions: newOptions }));
                            }}
                            placeholder={`Option ${index + 1}`}
                            className="bg-background"
                          />
                          {newAnnouncement.pollOptions.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newOptions = newAnnouncement.pollOptions.filter((_, i) => i !== index);
                                setNewAnnouncement(prev => ({ ...prev, pollOptions: newOptions }));
                              }}
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      ))}
                      {newAnnouncement.pollOptions.length < 6 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNewAnnouncement(prev => ({ 
                              ...prev, 
                              pollOptions: [...prev.pollOptions, ''] 
                            }));
                          }}
                        >
                          + Add Option
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pollExpiresAt" className="text-xs">Poll Expires At (Optional)</Label>
                      <Input
                        id="pollExpiresAt"
                        type="date"
                        value={newAnnouncement.pollExpiresAt}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, pollExpiresAt: e.target.value }))}
                        className="mt-1 bg-background"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="allowMultipleVotes"
                        checked={newAnnouncement.allowMultipleVotes}
                        onChange={(e) => setNewAnnouncement(prev => ({ ...prev, allowMultipleVotes: e.target.checked }))}
                        className="rounded"
                      />
                      <Label htmlFor="allowMultipleVotes" className="text-xs">Allow multiple votes</Label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-2">
              <Button onClick={handleCreateAnnouncement}>
                <Send className="h-4 w-4 mr-2" />
                Post Announcement
              </Button>
              <Button variant="ghost" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      {isAdmin && viewMode === 'admin' && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center space-x-2 flex-grow">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-1 bg-transparent border-0 rounded-md text-sm focus:ring-0"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1 bg-transparent border-0 rounded-md text-sm focus:ring-0"
                >
                  <option value="all">All Categories</option>
                  <option value="Clinical Updates">Clinical Updates</option>
                  <option value="Staff Meetings">Staff Meetings</option>
                  <option value="Safety & Compliance">Safety & Compliance</option>
                  <option value="Resident Updates">Resident Updates</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements Feed */}
      <div className="space-y-4">
        {filteredAnnouncements.map((item) => (
          <Card 
            key={item.id} 
            className={`transition-all ${!item.isAcknowledged && item.isActive ? 'bg-yellow-50/50 border-yellow-200' : 'bg-card'}`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-full">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{item.author}</p>
                    <p className="text-xs text-muted-foreground">{item.authorRole} • {item.date}</p>
                  </div>
                </div>
                <Badge className={getPriorityColor(item.priority)}>
                  {item.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-bold text-foreground">{item.title}</h3>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{item.content}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
                <span>Category: {item.category}</span>
                {item.expiresAt && <span>Expires: {item.expiresAt}</span>}
              </div>

              {/* Poll Display */}
              {item.poll && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg border">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {item.poll.question}
                  </h4>
                  <div className="space-y-2">
                    {item.poll.options.map((option) => {
                      const currentUser = profile?.email || 'Current User';
                      const hasVoted = option.voters.includes(currentUser);
                      const percentage = item.poll!.totalVotes > 0 ? (option.votes / item.poll!.totalVotes) * 100 : 0;
                      
                      return (
                        <div key={option.id} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground">{option.text}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          {item.poll!.isActive && (
                            <Button
                              size="sm"
                              variant={hasVoted ? "default" : "outline"}
                              onClick={() => handlePollVote(item.id, option.id)}
                              className="mt-1 h-6 text-xs"
                              disabled={hasVoted && !item.poll!.allowMultipleVotes}
                            >
                              {hasVoted ? "✓ Voted" : "Vote"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.poll.totalVotes} total vote{item.poll.totalVotes !== 1 ? 's' : ''}</span>
                      {item.poll.expiresAt && (
                        <span>Poll expires: {item.poll.expiresAt}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardContent>
              {item.isAcknowledged ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">You acknowledged this on {item.acknowledgedAt}</span>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => handleAcknowledge(item.id)}
                  className="w-full"
                  variant="outline"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Acknowledge
                </Button>
              )}
              {item.acknowledgedBy.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    <Users className="h-3 w-3 inline-block mr-1" />
                    Acknowledged by {item.acknowledgedBy.length} staff member(s)
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
