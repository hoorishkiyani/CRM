-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pipeline_stages table
CREATE TABLE IF NOT EXISTS pipeline_stages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    order_index INTEGER NOT NULL,
    color VARCHAR(7) NOT NULL,
    description TEXT
);

-- Insert default pipeline stages
INSERT INTO pipeline_stages (id, name, order_index, color, description) VALUES
('llamada_verificacion', '1. Llamada de Verificación', 1, '#FF9800', 'Verificar información inicial del lead'),
('boceto_presupuesto', '2. Boceto y Presupuesto', 2, '#2196F3', 'Crear boceto y presupuesto'),
('esperando_respuesta', '3. Esperando Respuesta', 3, '#9C27B0', 'Esperando respuesta del cliente'),
('contestar_cliente', '4. Contestar al Cliente', 4, '#4CAF50', 'Responder consultas del cliente'),
('standby', '5. Standby', 5, '#607D8B', 'En espera'),
('venta_ganada', '6. Venta Ganada', 6, '#009688', 'Venta exitosa'),
('venta_perdida', '7. Venta Perdida', 7, '#F44336', 'Venta perdida'),
('incidencias', '8. Incidencias', 8, '#FF5722', 'Problemas o incidencias'),
('incidencia_cerrada', '9. Incidencia Cerrada', 9, '#8BC34A', 'Incidencia resuelta')
ON CONFLICT (id) DO NOTHING;

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_number SERIAL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    product VARCHAR(255) NOT NULL,
    notes TEXT,
    notes_internal JSONB DEFAULT '[]',
    label_color VARCHAR(7),
    label_text VARCHAR(10),
    current_stage VARCHAR(50) NOT NULL DEFAULT 'llamada_verificacion' REFERENCES pipeline_stages(id),
    is_locked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    message_id VARCHAR(255),
    content TEXT NOT NULL,
    channel VARCHAR(50) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response TEXT,
    ai_generated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_current_stage ON leads(current_stage);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
