-- Add SCORM 1.2 specific fields to scorm_tracking table for better querying and reporting
ALTER TABLE scorm_tracking 
ADD COLUMN student_id TEXT,
ADD COLUMN student_name TEXT,
ADD COLUMN lesson_location TEXT,
ADD COLUMN lesson_status TEXT DEFAULT 'not attempted',
ADD COLUMN score_raw NUMERIC,
ADD COLUMN score_max NUMERIC,
ADD COLUMN score_min NUMERIC,
ADD COLUMN total_time INTERVAL DEFAULT '00:00:00',
ADD COLUMN session_time INTERVAL DEFAULT '00:00:00',
ADD COLUMN suspend_data TEXT,
ADD COLUMN launch_data TEXT,
ADD COLUMN comments TEXT,
ADD COLUMN interactions JSONB DEFAULT '[]',
ADD COLUMN objectives JSONB DEFAULT '[]',
ADD COLUMN last_accessed TIMESTAMPTZ DEFAULT NOW();

-- Create indexes for common queries
CREATE INDEX idx_scorm_tracking_user_course ON scorm_tracking(user_id, scorm_course_id);
CREATE INDEX idx_scorm_tracking_status ON scorm_tracking(lesson_status);
CREATE INDEX idx_scorm_tracking_last_accessed ON scorm_tracking(last_accessed);

-- Add constraints for lesson_status
ALTER TABLE scorm_tracking 
ADD CONSTRAINT check_lesson_status 
CHECK (lesson_status IN ('passed', 'completed', 'failed', 'incomplete', 'browsed', 'not attempted'));

-- Add constraints for score values
ALTER TABLE scorm_tracking 
ADD CONSTRAINT check_score_raw 
CHECK (score_raw IS NULL OR (score_raw >= 0 AND score_raw <= 100));

ALTER TABLE scorm_tracking 
ADD CONSTRAINT check_score_max 
CHECK (score_max IS NULL OR (score_max >= 0 AND score_max <= 100));

ALTER TABLE scorm_tracking 
ADD CONSTRAINT check_score_min 
CHECK (score_min IS NULL OR (score_min >= 0 AND score_min <= 100));

-- Create a function to update last_accessed timestamp
CREATE OR REPLACE FUNCTION update_scorm_tracking_last_accessed()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_accessed = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update last_accessed
CREATE TRIGGER trigger_update_scorm_tracking_last_accessed
    BEFORE UPDATE ON scorm_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_scorm_tracking_last_accessed();
