-- ============================================================
-- MEDIKIOSK — Complete Database Schema
-- Run this ENTIRE file in Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → Your Project → SQL Editor → New Query
-- ============================================================

-- ── Table 1: users ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE,
  name text,
  role text,                             -- 'patient' | 'doctor' | 'admin'
  is_active boolean DEFAULT true,        -- New: Support for deactivation
  fcm_token text,                        -- Firebase Cloud Messaging token
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- ── Table 2: medicines ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  generic_name text,
  category text,                         -- Antibiotic/Painkiller/Diabetic/BP/Vitamin/Other
  side_effects text,
  usage_instructions text,
  food_interactions text,
  max_daily_dosage text,
  is_controlled boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ── Table 3: prescriptions ───────────────────────────────────
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES users(id) ON DELETE SET NULL,
  doctor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  image_url text,
  raw_ocr_text text,
  extracted_data jsonb,
  status text DEFAULT 'pending',         -- 'pending' | 'approved' | 'rejected'
  doctor_notes text,
  ai_suggestion text,
  ai_risk_level text,                    -- 'low' | 'medium' | 'high'
  type text DEFAULT 'prescription',      -- 'prescription' | 'consultation'
  report_id uuid REFERENCES health_reports(id),
  payment_status text DEFAULT 'pending', -- 'pending' | 'paid'
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ── Table 4: prescription_medicines ─────────────────────────
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name text,
  dosage text,
  frequency text,
  duration text,
  quantity integer
);

-- ── Table 5: inventory ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES medicines(id) ON DELETE CASCADE,
  stock_quantity integer DEFAULT 0,
  low_stock_threshold integer DEFAULT 10,
  last_restocked timestamptz,
  expiry_date date,                      -- Track expiration
  unit_price numeric DEFAULT 0,          -- Cost per unit
  slot_number text,                      -- Physical slot in kiosk
  category text,                         -- Duplicate for fast indexing
  updated_at timestamptz DEFAULT now()
);

-- ── Table 6: dispense_logs ───────────────────────────────────
CREATE TABLE IF NOT EXISTS dispense_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE SET NULL,
  patient_id uuid REFERENCES users(id) ON DELETE SET NULL,
  medicines_dispensed jsonb,
  dispensed_at timestamptz DEFAULT now(),
  machine_id text,
  receipt_url text
);

-- ── Table 7: machine_status ──────────────────────────────────
CREATE TABLE IF NOT EXISTS machine_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text UNIQUE,
  status text DEFAULT 'offline',         -- 'online' | 'offline' | 'maintenance'
  last_active timestamptz,
  location text,
  total_dispenses integer DEFAULT 0,
  uptime_percentage numeric DEFAULT 100,
  temperature numeric DEFAULT 24,
  motor_status text DEFAULT 'operational',
  scanner_status text DEFAULT 'operational',
  network_status text DEFAULT 'connected',
  updated_at timestamptz DEFAULT now()
);

-- ── Table 8: machine_uptime_logs ─────────────────────────────
CREATE TABLE IF NOT EXISTS machine_uptime_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id text,
  status text,
  logged_at timestamptz DEFAULT now()
);

-- ── Table 9: alerts ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text,                             -- 'stock' | 'expiry' | 'machine'
  severity text,                         -- 'critical' | 'warning' | 'info'
  title text,
  message text,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ── Table 10: settings ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE,
  value text,
  updated_at timestamptz DEFAULT now()
);

-- ── Seed Default Settings ────────────────────────────────────
INSERT INTO settings (key, value) VALUES
('low_stock_threshold', '10'),
('expiry_warning_days', '30'),
('machine_timeout_minutes', '5'),
('alert_low_stock', 'true'),
('alert_expiry', 'true'),
('alert_machine_offline', 'true'),
('alert_new_prescription', 'false'),
('alert_daily_summary', 'true')
ON CONFLICT (key) DO NOTHING;

-- ── Supabase Realtime ─────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE machine_status;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE health_reports;

-- ── Table 11: health_reports ──────────────────────────────────
CREATE TABLE IF NOT EXISTS health_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES users(id) ON DELETE CASCADE,
  report_type text,                      -- 'Blood Test' | 'ECG' | etc.
  image_url text,
  raw_ocr_text text,
  extracted_values jsonb,                -- Array of {test_name, value, unit, status}
  ai_summary text,
  ai_recommendation text,
  has_critical_values boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
