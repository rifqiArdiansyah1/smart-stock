-- Create function to prevent modifications
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Tabel audit_logs bersifat append-only. Operasi UPDATE atau DELETE tidak diizinkan.';
END;
$$ LANGUAGE plpgsql;

-- Create trigger on audit_logs table
CREATE TRIGGER audit_logs_prevent_mod
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();
