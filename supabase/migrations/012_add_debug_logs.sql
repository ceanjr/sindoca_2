-- Create debug_logs table for remote logging
CREATE TABLE IF NOT EXISTS debug_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'debug')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_agent TEXT,
  url TEXT
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_debug_logs_created_at ON debug_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_debug_logs_user_id ON debug_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_debug_logs_category ON debug_logs(category);
CREATE INDEX IF NOT EXISTS idx_debug_logs_level ON debug_logs(level);

-- Enable RLS
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Qualquer usuário autenticado pode inserir logs
CREATE POLICY "Authenticated users can insert logs"
ON debug_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Apenas admins podem ler logs
-- Você pode ajustar isso para permitir que usuários vejam seus próprios logs
CREATE POLICY "Users can read their own logs"
ON debug_logs FOR SELECT
TO authenticated
USING (true); -- Por enquanto, todos podem ver todos os logs (útil para debug)

-- Função para limpar logs antigos (opcional)
CREATE OR REPLACE FUNCTION clean_old_debug_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM debug_logs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- Comentário na tabela
COMMENT ON TABLE debug_logs IS 'Logs remotos para debug de problemas no navegador dos usuários';
