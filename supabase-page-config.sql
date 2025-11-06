-- Create table for page configuration
CREATE TABLE IF NOT EXISTS page_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  icon TEXT,
  path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default page configurations
INSERT INTO page_config (page_id, label, is_active, icon, path) VALUES
  ('inicio', 'Início', true, 'Home', '/'),
  ('galeria', 'Galeria', true, 'Image', '/galeria'),
  ('amor', 'O Que Amo', true, 'Heart', '/amor'),
  ('musica', 'Música', true, 'Music', '/musica'),
  ('conquistas', 'Conquistas', true, 'Trophy', '/conquistas'),
  ('mensagens', 'Mensagens', true, 'MessageCircle', '/mensagens'),
  ('surpresas', 'Surpresas', true, 'Gift', '/surpresas'),
  ('legado', 'Legado', true, 'Archive', '/legado')
ON CONFLICT (page_id) DO NOTHING;

-- Enable RLS
ALTER TABLE page_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read page config
CREATE POLICY "Anyone can read page config"
  ON page_config FOR SELECT
  USING (true);

-- Policy: Only specific admin can update
CREATE POLICY "Only admin can update page config"
  ON page_config FOR UPDATE
  USING (auth.jwt() ->> 'email' = 'celiojunior0110@gmail.com');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_page_config_updated_at BEFORE UPDATE ON page_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
