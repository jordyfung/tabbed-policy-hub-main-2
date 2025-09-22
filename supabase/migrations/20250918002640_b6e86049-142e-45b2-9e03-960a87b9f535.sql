-- Create posts table for newsfeed
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  author_type TEXT NOT NULL CHECK (author_type IN ('system', 'user')),
  title TEXT,
  content TEXT NOT NULL,
  priority TEXT CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create comment likes table
CREATE TABLE public.comment_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Everyone can view posts" 
ON public.posts FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create posts" 
ON public.posts FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own posts" 
ON public.posts FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own posts" 
ON public.posts FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for comments
CREATE POLICY "Everyone can view comments" 
ON public.post_comments FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own comments" 
ON public.post_comments FOR UPDATE 
USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = author_id);

-- RLS Policies for post likes
CREATE POLICY "Everyone can view post likes" 
ON public.post_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage their post likes" 
ON public.post_likes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for comment likes
CREATE POLICY "Everyone can view comment likes" 
ON public.comment_likes FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage their comment likes" 
ON public.comment_likes FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add updated_at triggers
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_post_comments_updated_at
  BEFORE UPDATE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();