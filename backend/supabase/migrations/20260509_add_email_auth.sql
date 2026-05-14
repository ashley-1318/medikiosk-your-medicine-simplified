-- Update existing otp_logs table to support both phone and email OTP
ALTER TABLE otp_logs
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS otp_type text DEFAULT 'phone',
ADD COLUMN IF NOT EXISTS otp_hash text,
ADD COLUMN IF NOT EXISTS attempt_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_locked boolean DEFAULT false;

-- Update existing users table to support email
ALTER TABLE users
ADD COLUMN IF NOT EXISTS email text UNIQUE,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auth_method text DEFAULT 'phone', -- 'phone', 'email', 'both'
ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_login_method text, -- 'phone_otp', 'email_otp'
ADD COLUMN IF NOT EXISTS greeting_sent boolean DEFAULT false;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_otp_logs_email ON otp_logs(email);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
ALTER TABLE dispense_logs ADD COLUMN IF NOT EXISTS payment_email_sent boolean DEFAULT false, ADD COLUMN IF NOT EXISTS payment_email_sent_at timestamp, ADD COLUMN IF NOT EXISTS dispense_email_sent boolean DEFAULT false, ADD COLUMN IF NOT EXISTS dispense_email_sent_at timestamp, ADD COLUMN IF NOT EXISTS health_report_url text, ADD COLUMN IF NOT EXISTS receipt_id text;
