-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'staff');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role user_role NOT NULL DEFAULT 'staff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  duration_hours INTEGER,
  is_mandatory BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course frequencies table
CREATE TABLE public.course_frequencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  frequency_months INTEGER NOT NULL, -- How often course needs to be completed
  role user_role, -- If null, applies to all roles
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course assignments table
CREATE TABLE public.course_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL REFERENCES public.profiles(user_id),
  due_date TIMESTAMP WITH TIME ZONE,
  is_mandatory BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course completions table
CREATE TABLE public.course_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID NOT NULL REFERENCES public.course_assignments(id) ON DELETE CASCADE,
  completed_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  score INTEGER,
  notes TEXT
);

-- Create incidents table
CREATE TABLE public.incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT CHECK (status IN ('open', 'investigating', 'resolved', 'closed')) DEFAULT 'open',
  reported_by UUID NOT NULL REFERENCES public.profiles(user_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remedial actions table
CREATE TABLE public.remedial_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  action_description TEXT NOT NULL,
  assigned_to UUID NOT NULL REFERENCES public.profiles(user_id),
  assigned_by UUID NOT NULL REFERENCES public.profiles(user_id),
  due_date TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue')) DEFAULT 'pending',
  completion_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create improvement ideas table
CREATE TABLE public.improvement_ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'implemented')) DEFAULT 'submitted',
  submitted_by UUID NOT NULL REFERENCES public.profiles(user_id),
  reviewed_by UUID REFERENCES public.profiles(user_id),
  implementation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_frequencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remedial_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_ideas ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = $1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.get_user_role(auth.uid()) = 'admin');

-- Courses policies
CREATE POLICY "Everyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Course frequencies policies
CREATE POLICY "Everyone can view frequencies" ON public.course_frequencies FOR SELECT USING (true);
CREATE POLICY "Admins can manage frequencies" ON public.course_frequencies FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Course assignments policies
CREATE POLICY "Users can view own assignments" ON public.course_assignments FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can view all assignments" ON public.course_assignments FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can manage assignments" ON public.course_assignments FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Course completions policies
CREATE POLICY "Users can view own completions" ON public.course_completions FOR SELECT USING (auth.uid() = completed_by);
CREATE POLICY "Users can create own completions" ON public.course_completions FOR INSERT WITH CHECK (auth.uid() = completed_by);
CREATE POLICY "Admins can view all completions" ON public.course_completions FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');

-- Incidents policies
CREATE POLICY "Everyone can view incidents" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Everyone can create incidents" ON public.incidents FOR INSERT WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Admins can manage incidents" ON public.incidents FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Remedial actions policies
CREATE POLICY "Users can view assigned actions" ON public.remedial_actions FOR SELECT USING (auth.uid() = assigned_to);
CREATE POLICY "Users can update assigned actions" ON public.remedial_actions FOR UPDATE USING (auth.uid() = assigned_to);
CREATE POLICY "Admins can manage all actions" ON public.remedial_actions FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Improvement ideas policies
CREATE POLICY "Users can view own ideas" ON public.improvement_ideas FOR SELECT USING (auth.uid() = submitted_by);
CREATE POLICY "Users can create ideas" ON public.improvement_ideas FOR INSERT WITH CHECK (auth.uid() = submitted_by);
CREATE POLICY "Admins can view all ideas" ON public.improvement_ideas FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admins can manage ideas" ON public.improvement_ideas FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_improvement_ideas_updated_at BEFORE UPDATE ON public.improvement_ideas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();