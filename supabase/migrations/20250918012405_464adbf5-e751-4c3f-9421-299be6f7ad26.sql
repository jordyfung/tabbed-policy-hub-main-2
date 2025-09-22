-- Update posts to use correct Directors of Nursing with 'system' author_type
UPDATE posts 
SET 
  author_name = 'Diana Gan',
  author_id = '550e8400-e29b-41d4-a716-446655440001'
WHERE author_name = 'Diana Mitchell';

-- Update remaining posts to use Patrick Fe
UPDATE posts 
SET 
  author_name = 'Patrick Fe',
  author_id = '550e8400-e29b-41d4-a716-446655440002'
WHERE author_name = 'OriComply' AND title LIKE '%Patient Safety%';

-- Add a new post from Patrick Fe using 'system' author_type
INSERT INTO posts (
  id,
  author_id,
  author_name,
  author_role,
  author_type,
  title,
  content,
  category,
  priority,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440015',
  '550e8400-e29b-41d4-a716-446655440002',
  'Patrick Fe',
  'Director of Nursing',
  'system',
  'Upcoming Mandatory Training: Infection Control',
  'All nursing staff are required to complete the updated Infection Control training module by the end of this month. This training covers the latest protocols for preventing healthcare-associated infections and includes new guidelines from the CDC. Please prioritize this training as it directly impacts patient safety and our accreditation status.',
  'training',
  'high',
  NOW() - INTERVAL '2 days'
);