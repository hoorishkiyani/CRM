-- Add missing fields to messages table for email threading
ALTER TABLE messages ADD COLUMN IF NOT EXISTS in_reply_to VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id VARCHAR(255);

-- Add mandatory activities and transition conditions to pipeline_stages
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS mandatory_activities JSONB DEFAULT '[]';
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS transition_conditions JSONB DEFAULT '{}';
ALTER TABLE pipeline_stages ADD COLUMN IF NOT EXISTS automation_logic JSONB DEFAULT '{}';

-- Add time-based triggers to activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS trigger_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT FALSE;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT FALSE;

-- Add lead locking and stage enforcement
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_locked_reason TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_stage_change TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update pipeline stages with mandatory activities
UPDATE pipeline_stages SET 
  mandatory_activities = CASE 
    WHEN id = 'llamada_verificacion' THEN '[{"type": "call", "description": "Realizar llamada de verificación", "required": true}]'::jsonb
    WHEN id = 'boceto_presupuesto' THEN '[{"type": "quote", "description": "Crear presupuesto", "required": true}, {"type": "design", "description": "Crear boceto", "required": true}]'::jsonb
    WHEN id = 'contestar_cliente' THEN '[{"type": "response", "description": "Responder consultas del cliente", "required": true}]'::jsonb
    ELSE '[]'::jsonb
  END,
  transition_conditions = CASE
    WHEN id = 'llamada_verificacion' THEN '{"min_activities_completed": 1, "required_activity_types": ["call"]}'::jsonb
    WHEN id = 'boceto_presupuesto' THEN '{"min_activities_completed": 2, "required_activity_types": ["quote", "design"]}'::jsonb
    ELSE '{}'::jsonb
  END;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_in_reply_to ON messages(in_reply_to);
CREATE INDEX IF NOT EXISTS idx_activities_mandatory ON activities(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_activities_trigger_time ON activities(trigger_time);

-- Create function to check stage advancement eligibility
CREATE OR REPLACE FUNCTION can_advance_stage(lead_uuid UUID, target_stage_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    current_stage_record RECORD;
    mandatory_activities_json JSONB;
    completed_mandatory_count INTEGER;
    required_count INTEGER;
BEGIN
    -- Get current stage info
    SELECT ps.* INTO current_stage_record
    FROM leads l
    JOIN pipeline_stages ps ON l.current_stage = ps.id
    WHERE l.id = lead_uuid;
    
    -- Get mandatory activities for current stage
    mandatory_activities_json := current_stage_record.mandatory_activities;
    
    -- If no mandatory activities, allow advancement
    IF mandatory_activities_json = '[]'::jsonb OR mandatory_activities_json IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Count required mandatory activities
    SELECT jsonb_array_length(mandatory_activities_json) INTO required_count;
    
    -- Count completed mandatory activities for this lead
    SELECT COUNT(*) INTO completed_mandatory_count
    FROM activities a
    WHERE a.lead_id = lead_uuid 
    AND a.is_mandatory = TRUE 
    AND a.is_completed = TRUE;
    
    -- Check if all mandatory activities are completed
    RETURN completed_mandatory_count >= required_count;
END;
$$ LANGUAGE plpgsql;
