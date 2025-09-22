import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Send, Plus, Clock, Heart, MoreHorizontal, Building2, AtSign, Trash2 } from 'lucide-react';

interface Comment {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  content: string;
  created_at: string;
  mentions?: string[];
  isLiked?: boolean;
  likes?: number;
}

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_type: 'system' | 'user';
  content: string;
  title?: string;
  created_at: string;
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  priority?: 'high' | 'medium' | 'low';
  category?: string;
  isExpanded?: boolean;
}

export default function NewsfeedFeed() {
  const { profile, isAdmin, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState('');
  const [showPostForm, setShowPostForm] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [showComments, setShowComments] = useState<{[key: string]: boolean}>({});
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if user is a director of nursing
  const isDirector = profile?.role === 'admin' && 
    (profile?.first_name?.toLowerCase().includes('diana') || 
     profile?.first_name?.toLowerCase().includes('patrick'));

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Fetch posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Fetch comments for each post
      const postsWithComments = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: comments, error: commentsError } = await supabase
            .from('post_comments')
            .select('*')
            .eq('post_id', post.id)
            .order('created_at', { ascending: true });

          if (commentsError) {
            console.error('Error fetching comments:', commentsError);
          }

          // Get like count for the post
          const { count: likeCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          // Check if current user liked the post
          const { data: userLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', profile?.user_id || '')
            .single();

          return {
            id: post.id,
            author_id: post.author_id,
            author_name: post.author_name,
            author_role: post.author_role,
            author_type: post.author_type as 'system' | 'user',
            content: post.content,
            title: post.title,
            created_at: post.created_at,
            priority: post.priority as 'high' | 'medium' | 'low' | undefined,
            category: post.category,
            comments: comments || [],
            likes: likeCount || 0,
            isLiked: !!userLike,
            isExpanded: false
          };
        })
      );

      setPosts(postsWithComments);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile?.user_id) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        // Unlike
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', profile.user_id);
      } else {
        // Like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: profile.user_id
          });
      }

      // Update local state
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1
            }
          : p
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (postId: string) => {
    const commentText = commentInputs[postId];
    if (!commentText?.trim() || !profile?.user_id) return;

    try {
      const { data: newComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          author_id: profile.user_id,
          author_name: `${profile.first_name} ${profile.last_name}`,
          author_role: profile.role === 'admin' ? 'Director of Nursing' : 'Staff Member',
          content: commentText,
          mentions: extractMentions(commentText)
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      ));

      setCommentInputs(prev => ({ ...prev, [postId]: '' }));

      toast({
        title: "Success",
        description: "Comment added successfully",
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    }
  };

  const extractMentions = (text: string): string[] => {
    const mentions = text.match(/@(\w+(?:\.\w+)?)/g);
    return mentions ? mentions.map(m => m.slice(1)) : [];
  };

  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const toggleExpanded = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, isExpanded: !post.isExpanded }
        : post
    ));
  };

  const truncateContent = (content: string, maxLength: number = 200) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  const handlePost = async () => {
    if (!newPost.trim() || !profile?.user_id) return;

    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: profile.user_id,
          author_name: `${profile.first_name} ${profile.last_name}`,
          author_role: profile.role === 'admin' ? 'Director of Nursing' : 'Staff Member',
          author_type: 'user',
          content: newPost
        });

      if (error) throw error;

      setNewPost('');
      setShowPostForm(false);
      fetchPosts(); // Refresh posts

      toast({
        title: "Success",
        description: "Post created successfully",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    }
  };

  const getAvatarContent = (authorType: string, author: string) => {
    if (authorType === 'system') {
      return <Building2 className="h-4 w-4" />;
    }
    return author.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getAvatarColor = (authorType: string) => {
    return authorType === 'system' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatPostContent = (content: string) => {
    // Split content into lines and format each line
    return content.split('\n').map((line, index) => {
      // Format bullet points with emojis
      const bulletLine = line.replace(/🔹\s*\*\*(.*?)\*\*:\s*(.*)/g, (match, title, description) => {
        return `🔹 **${title}**: ${description}`;
      });
      
      // Handle bold text **text**
      const formattedLine = bulletLine.split(/(\*\*.*?\*\*)/).map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      return (
        <div key={index} className={line.trim().startsWith('🔹') ? 'pl-4' : ''}>
          {formattedLine}
        </div>
      );
    });
  };

  const handleDeletePost = async (postId: string) => {
    if (!isSuperAdmin) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      setPosts(posts.filter(p => p.id !== postId));

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="space-y-2">
                    <div className="w-32 h-4 bg-muted rounded"></div>
                    <div className="w-24 h-3 bg-muted rounded"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-4 bg-muted rounded"></div>
                  <div className="w-3/4 h-4 bg-muted rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Newsfeed</h2>
          <p className="text-foreground/60">Industry updates and team announcements</p>
        </div>
        
        {isDirector && (
          <Button onClick={() => setShowPostForm(!showPostForm)}>
            <Plus className="w-4 h-4 mr-2" />
            New Post
          </Button>
        )}
      </div>

      {/* Create Post Form */}
      {showPostForm && isDirector && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{profile?.first_name} {profile?.last_name}</p>
                <p className="text-xs text-muted-foreground">Director of Nursing</p>
              </div>
            </div>
            <Textarea
              placeholder="What would you like to share with the team?"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowPostForm(false)}>
                Cancel
              </Button>
              <Button onClick={handlePost} disabled={!newPost.trim()}>
                <Send className="w-4 h-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="space-y-4">
              {/* Post Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className={getAvatarColor(post.author_type)}>
                      {getAvatarContent(post.author_type, post.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-sm">{post.author_name}</p>
                      {post.author_type === 'system' && (
                        <Badge variant="secondary" className="text-xs">
                          AI Curated
                        </Badge>
                      )}
                      {post.priority && post.author_type === 'system' && (
                        <Badge 
                          variant={post.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {post.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{post.author_role}</span>
                      <span>•</span>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(post.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
                {isSuperAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeletePost(post.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Post
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Post Content */}
              <div className="space-y-2">
                {post.title && (
                  <h3 className="font-semibold text-foreground">{post.title}</h3>
                )}
                <div className="text-foreground/80 leading-relaxed">
                  {post.isExpanded || post.content.length <= 200 ? (
                    <div className="whitespace-pre-line space-y-2">
                      {formatPostContent(post.content)}
                    </div>
                  ) : (
                    <div>
                      <div className="whitespace-pre-line">
                        {formatPostContent(truncateContent(post.content))}
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => toggleExpanded(post.id)}
                        className="p-0 h-auto text-primary hover:underline"
                      >
                        See more
                      </Button>
                    </div>
                  )}
                  {post.isExpanded && post.content.length > 200 && (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => toggleExpanded(post.id)}
                      className="p-0 h-auto text-primary hover:underline mt-2"
                    >
                      See less
                    </Button>
                  )}
                </div>
              </div>
              
              {/* Post Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 ${post.isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <Heart className={`h-4 w-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm">{post.likes}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center space-x-2 text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{post.comments.length}</span>
                  </Button>
                </div>
              </div>

              {/* Comments Section */}
              {showComments[post.id] && (
                <div className="mt-4 pt-4 border-t border-border space-y-4">
                  {/* Existing Comments */}
                  <div className="space-y-3">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex space-x-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                            {comment.author_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="font-medium text-xs">{comment.author_name}</p>
                              <p className="text-xs text-muted-foreground">{comment.author_role}</p>
                            </div>
                            <p className="text-sm text-foreground/80">{comment.content}</p>
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0">
                              Like
                            </Button>
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-auto p-0">
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment */}
                  <div className="flex space-x-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex space-x-2">
                      <Input
                        placeholder="Add a comment... (use @username to mention)"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                        size="sm"
                      >
                        <Send className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center py-4">
        <Button variant="outline">
          Load More Posts
        </Button>
      </div>
    </div>
  );
}