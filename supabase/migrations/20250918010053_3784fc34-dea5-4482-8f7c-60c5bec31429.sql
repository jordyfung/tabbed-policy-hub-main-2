-- Insert seed posts for the newsfeed
INSERT INTO public.posts (author_id, author_name, author_type, author_role, title, content, category, priority, created_at) VALUES
-- OriComply system posts (industry news)
('00000000-0000-0000-0000-000000000001', 'OriComply', 'system', 'system', 'New NDIS Quality Standards Update', 'The NDIS Quality and Safeguards Commission has released updated guidelines for service providers. Key changes include enhanced reporting requirements and revised audit procedures. All staff should familiarize themselves with these updates by the end of this month.', 'Compliance Update', 'high', now() - interval '2 hours'),

('00000000-0000-0000-0000-000000000001', 'OriComply', 'system', 'system', 'Medication Management Training Requirement', 'New mandatory training requirements for medication management have been introduced. All clinical staff must complete the updated training module within 30 days. This affects approximately 80% of our current workforce.', 'Training Update', 'high', now() - interval '1 day'),

('00000000-0000-0000-0000-000000000001', 'OriComply', 'system', 'system', 'Privacy Act Amendments - Action Required', 'Recent amendments to the Privacy Act affect how we handle client information. Review the updated privacy procedures in the compliance portal and ensure all documentation reflects the new requirements.', 'Policy Change', 'medium', now() - interval '3 days'),

('00000000-0000-0000-0000-000000000001', 'OriComply', 'system', 'system', 'Infection Control Best Practices', 'Updated infection control guidelines are now available following recent health department recommendations. These include revised hand hygiene protocols and enhanced cleaning procedures for common areas.', 'Best Practices', 'medium', now() - interval '5 days'),

-- Diana (Director of Nursing) internal posts
('00000000-0000-0000-0000-000000000002', 'Diana Mitchell', 'user', 'admin', 'Team Meeting - Monthly Care Review', 'Our monthly care review meeting is scheduled for this Friday at 2:00 PM in Conference Room A. We''ll be discussing client care plans, staffing updates, and the new quality improvement initiatives. All department heads please attend.', 'Team Announcement', NULL, now() - interval '6 hours'),

('00000000-0000-0000-0000-000000000002', 'Diana Mitchell', 'user', 'admin', 'Welcome Our New Clinical Coordinator', 'Please join me in welcoming Sarah Thompson to our team as the new Clinical Coordinator. Sarah brings 8 years of experience in aged care and will be working closely with all departments to enhance our care delivery standards.', 'Team Announcement', NULL, now() - interval '2 days'),

('00000000-0000-0000-0000-000000000002', 'Diana Mitchell', 'user', 'admin', 'Q3 Performance Results', 'I''m pleased to share that our Q3 performance metrics show significant improvement across all key areas. Client satisfaction is up 12%, compliance scores have improved by 8%, and staff retention has increased. Great work everyone!', 'Performance Update', NULL, now() - interval '4 days'),

('00000000-0000-0000-0000-000000000002', 'Diana Mitchell', 'user', 'admin', 'Upcoming Audit Preparation', 'Our annual quality audit is scheduled for next month. Department heads should begin preparing documentation and ensure all staff are aware of the audit procedures. I''ll be sending out detailed preparation checklists by Friday.', 'Audit Notice', NULL, now() - interval '1 week');