-- Create employee_profiles table for AI-generated work preferences
CREATE TABLE IF NOT EXISTS employee_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure one profile per user
CREATE UNIQUE INDEX IF NOT EXISTS employee_profiles_user_id_unique ON employee_profiles(user_id);

-- Create updated_at trigger (function already exists, just create trigger)
CREATE TRIGGER update_employee_profiles_updated_at 
  BEFORE UPDATE ON employee_profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE employee_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON employee_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON employee_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON employee_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles" ON employee_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super-admin')
    )
  );

