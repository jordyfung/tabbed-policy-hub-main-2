-- Fix security warnings by adding SET search_path = public to all functions

-- Fix calculate_next_due_date function
CREATE OR REPLACE FUNCTION public.calculate_next_due_date(
  assignment_id_param UUID
) RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_completion TIMESTAMP WITH TIME ZONE;
  frequency_months INTEGER;
  next_due TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get last completion date and frequency
  SELECT 
    ca.last_completed_at,
    cf.frequency_months
  INTO 
    last_completion,
    frequency_months
  FROM public.course_assignments ca
  JOIN public.courses c ON ca.course_id = c.id
  LEFT JOIN public.course_frequencies cf ON cf.course_id = c.id
  WHERE ca.id = assignment_id_param;
  
  -- If no frequency set, return null (one-time course)
  IF frequency_months IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Calculate next due date
  IF last_completion IS NULL THEN
    -- First time assignment - due based on assignment date
    SELECT due_date INTO next_due 
    FROM public.course_assignments 
    WHERE id = assignment_id_param;
  ELSE
    -- Recurring - add frequency to last completion
    next_due := last_completion + (frequency_months * interval '1 month');
  END IF;
  
  RETURN next_due;
END;
$$;

-- Fix check_and_award_achievements function
CREATE OR REPLACE FUNCTION public.check_and_award_achievements(
  user_id_param UUID,
  completion_id_param UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  completion_count INTEGER;
  consecutive_count INTEGER;
  achievement_exists BOOLEAN;
BEGIN
  -- Count total completions for user
  SELECT COUNT(*) INTO completion_count
  FROM public.course_completions
  WHERE completed_by = user_id_param;
  
  -- Award "First Course" achievement
  IF completion_count = 1 THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = user_id_param AND achievement_type = 'first_course'
    ) INTO achievement_exists;
    
    IF NOT achievement_exists THEN
      INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description, points)
      VALUES (user_id_param, 'first_course', 'First Steps', 'Completed your first training course', 100);
    END IF;
  END IF;
  
  -- Award milestone achievements
  IF completion_count IN (5, 10, 25, 50, 100) THEN
    SELECT EXISTS(
      SELECT 1 FROM public.user_achievements 
      WHERE user_id = user_id_param AND achievement_type = 'milestone_' || completion_count
    ) INTO achievement_exists;
    
    IF NOT achievement_exists THEN
      INSERT INTO public.user_achievements (user_id, achievement_type, achievement_name, description, points)
      VALUES (
        user_id_param, 
        'milestone_' || completion_count, 
        completion_count || ' Courses Completed', 
        'Reached ' || completion_count || ' completed courses',
        completion_count * 20
      );
    END IF;
  END IF;
  
  -- Update training streak
  INSERT INTO public.training_streaks (user_id, current_streak, longest_streak, last_completion_date)
  VALUES (user_id_param, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE 
      WHEN training_streaks.last_completion_date = CURRENT_DATE - 1 THEN training_streaks.current_streak + 1
      WHEN training_streaks.last_completion_date = CURRENT_DATE THEN training_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(training_streaks.longest_streak, 
      CASE 
        WHEN training_streaks.last_completion_date = CURRENT_DATE - 1 THEN training_streaks.current_streak + 1
        WHEN training_streaks.last_completion_date = CURRENT_DATE THEN training_streaks.current_streak
        ELSE 1
      END
    ),
    last_completion_date = CURRENT_DATE,
    updated_at = now();
END;
$$;

-- Fix trigger_award_achievements function
CREATE OR REPLACE FUNCTION public.trigger_award_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.check_and_award_achievements(NEW.completed_by, NEW.id);
  RETURN NEW;
END;
$$;

-- Fix update_assignment_due_dates function
CREATE OR REPLACE FUNCTION public.update_assignment_due_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update last completion date and increment count
  UPDATE public.course_assignments 
  SET 
    last_completed_at = NEW.completed_at,
    completion_count = completion_count + 1,
    next_due_date = public.calculate_next_due_date(NEW.assignment_id)
  WHERE id = NEW.assignment_id;
  
  RETURN NEW;
END;
$$;

-- Fix update_due_soon_flags function
CREATE OR REPLACE FUNCTION public.update_due_soon_flags()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.course_assignments
  SET is_due_soon = (
    next_due_date IS NOT NULL AND 
    next_due_date <= (CURRENT_DATE + interval '30 days') AND
    next_due_date > CURRENT_DATE
  );
END;
$$;