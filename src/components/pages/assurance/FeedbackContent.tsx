import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Star,
  Filter,
  Search,
  Plus,
  Eye,
  Reply
} from 'lucide-react';

interface Feedback {
  id: string;
  type: 'complaint' | 'feedback' | 'suggestion';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  title: string;
  description: string;
  submitter: string;
  email: string;
  date: string;
  category: string;
  rating?: number;
  comments: Comment[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  date: string;
  isInternal: boolean;
}

const mockFeedback: Feedback[] = [
  {
    id: 'FB001',
    type: 'complaint',
    priority: 'high',
    status: 'in-progress',
    title: 'Medication Administration Delay',
    description: 'My mother waited over 2 hours for her evening medication. This is unacceptable and needs immediate attention.',
    submitter: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    date: '2024-01-20',
    category: 'Clinical Care',
    rating: 2,
    comments: [
      {
        id: 'C001',
        author: 'Dr. Michael Chen',
        content: 'Reviewed with nursing team. Implementing new medication scheduling system to prevent delays.',
        date: '2024-01-21',
        isInternal: true
      }
    ]
  },
  {
    id: 'FB002',
    type: 'feedback',
    priority: 'medium',
    status: 'resolved',
    title: 'Excellent Physical Therapy Service',
    description: 'The physical therapy team has been wonderful. My mobility has improved significantly since starting the program.',
    submitter: 'Robert Williams',
    email: 'r.williams@email.com',
    date: '2024-01-18',
    category: 'Services',
    rating: 5,
    comments: [
      {
        id: 'C002',
        author: 'Lisa Thompson',
        content: 'Thank you for the positive feedback! Shared with the PT team.',
        date: '2024-01-19',
        isInternal: false
      }
    ]
  },
  {
    id: 'FB003',
    type: 'suggestion',
    priority: 'low',
    status: 'new',
    title: 'Request for More Vegetarian Meal Options',
    description: 'Would love to see more diverse vegetarian meal options in the dining room.',
    submitter: 'Margaret Davis',
    email: 'm.davis@email.com',
    date: '2024-01-22',
    category: 'Food Services',
    rating: 4,
    comments: []
  },
  {
    id: 'FB004',
    type: 'complaint',
    priority: 'urgent',
    status: 'new',
    title: 'Safety Concern - Wet Floor',
    description: 'There was a wet floor in the common area that was not properly marked. This is a serious safety hazard.',
    submitter: 'Anonymous',
    email: 'anonymous@email.com',
    date: '2024-01-23',
    category: 'Safety',
    rating: 1,
    comments: []
  }
];

export default function FeedbackContent() {
  const [feedback, setFeedback] = useState<Feedback[]>(mockFeedback);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [newComment, setNewComment] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFeedback = feedback.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.submitter.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesType && matchesSearch;
  });

  const handleAddComment = (feedbackId: string) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `C${Date.now()}`,
      author: 'Current User', // In real app, get from auth context
      content: newComment,
      date: new Date().toISOString().split('T')[0],
      isInternal: true
    };

    setFeedback(prev => prev.map(item => 
      item.id === feedbackId 
        ? { ...item, comments: [...item.comments, comment] }
        : item
    ));

    // Update selectedFeedback to reflect the new comment
    if (selectedFeedback && selectedFeedback.id === feedbackId) {
      setSelectedFeedback(prev => prev ? {
        ...prev,
        comments: [...prev.comments, comment]
      } : null);
    }

    setNewComment('');
  };

  const handleStatusChange = (feedbackId: string, newStatus: Feedback['status']) => {
    setFeedback(prev => prev.map(item => 
      item.id === feedbackId 
        ? { ...item, status: newStatus }
        : item
    ));

    // Update selectedFeedback to reflect the status change
    if (selectedFeedback && selectedFeedback.id === feedbackId) {
      setSelectedFeedback(prev => prev ? {
        ...prev,
        status: newStatus
      } : null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'complaint': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'feedback': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'suggestion': return <Star className="h-4 w-4 text-yellow-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const stats = {
    total: feedback.length,
    new: feedback.filter(f => f.status === 'new').length,
    inProgress: feedback.filter(f => f.status === 'in-progress').length,
    resolved: feedback.filter(f => f.status === 'resolved').length,
    avgRating: (feedback.reduce((acc, f) => acc + (f.rating || 0), 0) / feedback.filter(f => f.rating).length).toFixed(1)
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback & Complaints Management</h1>
        <p className="text-foreground/60 mt-2">Monitor and respond to resident and family feedback, complaints, and suggestions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Feedback</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Items</p>
                <p className="text-2xl font-bold text-foreground">{stats.new}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-foreground">{stats.inProgress}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Rating</p>
                <p className="text-2xl font-bold text-foreground">{stats.avgRating}/5</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feedback List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedback..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1 border border-border rounded-md text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="new">New</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-3 py-1 border border-border rounded-md text-sm"
                  >
                    <option value="all">All Types</option>
                    <option value="complaint">Complaints</option>
                    <option value="feedback">Feedback</option>
                    <option value="suggestion">Suggestions</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Items */}
          <div className="space-y-3">
            {filteredFeedback.map((item) => (
              <Card 
                key={item.id} 
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFeedback?.id === item.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedFeedback(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getTypeIcon(item.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-foreground">{item.title}</h3>
                          <Badge className={getStatusColor(item.status)}>
                            {item.status.replace('-', ' ')}
                          </Badge>
                          <Badge className={getPriorityColor(item.priority)}>
                            {item.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{item.submitter}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{item.date}</span>
                          </span>
                          <span>{item.category}</span>
                          {item.rating && (
                            <span className="flex items-center space-x-1">
                              <Star className="h-3 w-3" />
                              <span>{item.rating}/5</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        {item.comments.length} comments
                      </span>
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Feedback Detail Panel */}
        <div className="space-y-4">
          {selectedFeedback ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{selectedFeedback.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {selectedFeedback.type} • {selectedFeedback.category}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={selectedFeedback.status}
                      onChange={(e) => handleStatusChange(selectedFeedback.id, e.target.value as Feedback['status'])}
                      className="px-2 py-1 text-xs border border-border rounded"
                    >
                      <option value="new">New</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedFeedback.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">Submitter:</span>
                    <p className="text-muted-foreground">{selectedFeedback.submitter}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Email:</span>
                    <p className="text-muted-foreground">{selectedFeedback.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Date:</span>
                    <p className="text-muted-foreground">{selectedFeedback.date}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Priority:</span>
                    <Badge className={getPriorityColor(selectedFeedback.priority)}>
                      {selectedFeedback.priority}
                    </Badge>
                  </div>
                </div>

                {/* Comments Section */}
                <div>
                  <h4 className="font-medium text-foreground mb-3">Comments & Responses</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {selectedFeedback.comments.length > 0 ? (
                      selectedFeedback.comments.map((comment) => (
                        <div key={comment.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm text-foreground">
                              {comment.author}
                            </span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">{comment.date}</span>
                              {comment.isInternal && (
                                <Badge variant="secondary" className="text-xs">Internal</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No comments yet. Add the first response below.</p>
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="mt-4 space-y-2">
                    <Label htmlFor="new-comment">Add Comment</Label>
                    <Textarea
                      id="new-comment"
                      placeholder="Add your response or internal note..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={() => handleAddComment(selectedFeedback.id)}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Add Comment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-medium text-foreground mb-2">Select Feedback Item</h3>
                <p className="text-sm text-muted-foreground">
                  Choose a feedback item from the list to view details and add comments.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
