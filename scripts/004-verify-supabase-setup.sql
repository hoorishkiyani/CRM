-- Verify all tables exist and have correct structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'activities', 'messages', 'pipeline_stages', 'contacts')
ORDER BY table_name, ordinal_position;

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('leads', 'activities', 'messages', 'pipeline_stages', 'contacts');

-- Verify pipeline stages data
SELECT id, name, order_index, color, mandatory_activities 
FROM pipeline_stages 
ORDER BY order_index;

-- Check sample data
SELECT 
  l.id,
  l.lead_number,
  l.current_stage,
  l.is_locked,
  c.name as contact_name,
  c.email,
  COUNT(a.id) as activity_count
FROM leads l
JOIN contacts c ON l.contact_id = c.id
LEFT JOIN activities a ON l.id = a.lead_id
GROUP BY l.id, l.lead_number, l.current_stage, l.is_locked, c.name, c.email
ORDER BY l.lead_number DESC;

-- Verify functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'can_advance_stage';
