-- Insert sample contacts
INSERT INTO contacts (id, name, email, phone, address) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Juan Pérez', 'juan@example.com', '+34123456789', 'Calle Principal 123, Madrid'),
('550e8400-e29b-41d4-a716-446655440002', 'Laura García', 'laura@example.com', '+34698765432', 'Avenida Central 45, Barcelona'),
('550e8400-e29b-41d4-a716-446655440003', 'Carlos Ruiz', 'carlos@example.com', '+34611223344', 'Plaza Mayor 10, Valencia')
ON CONFLICT (id) DO NOTHING;

-- Insert sample leads
INSERT INTO leads (id, contact_id, product, notes, label_color, label_text, current_stage) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Neón', 'Interesado en neón personalizado para su tienda', '#4CAF50', 'URGENTE', 'llamada_verificacion'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Cuadro Neón', 'Necesita cuadro neón para su restaurante', '#F44336', 'NUEVO', 'boceto_presupuesto'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'Letras Corpóreas', 'Proyecto para oficina corporativa', '#2196F3', 'VIP', 'esperando_respuesta')
ON CONFLICT (id) DO NOTHING;

-- Insert sample activities
INSERT INTO activities (lead_id, text, type, is_completed) VALUES
('660e8400-e29b-41d4-a716-446655440001', '1. Llamada de Verificación', 'llamada_verificacion', false),
('660e8400-e29b-41d4-a716-446655440002', '2. Presupuesto y Boceto', 'boceto_presupuesto', false),
('660e8400-e29b-41d4-a716-446655440003', '3. Esperando Respuesta del Cliente', 'esperando_respuesta', false)
ON CONFLICT DO NOTHING;

-- Insert sample messages
INSERT INTO messages (lead_id, content, channel, sender) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'Hola, me gustaría información sobre neón personalizado para mi tienda', 'email', 'Juan Pérez'),
('660e8400-e29b-41d4-a716-446655440002', 'Buenos días, necesito cotización para cuadro neón de mi restaurante', 'whatsapp', 'Laura García'),
('660e8400-e29b-41d4-a716-446655440003', 'Estamos interesados en letras corpóreas para nuestra oficina', 'email', 'Carlos Ruiz')
ON CONFLICT DO NOTHING;
