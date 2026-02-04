-- Migration: Init Leads Nearby Schema (v2)

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'user', 'provider');
CREATE TYPE lead_status AS ENUM ('open', 'in_progress', 'completed', 'cancelled');
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'pending');
CREATE TYPE log_status AS ENUM ('fulfill', 'pending', 'rejected');

-- 2. PROFILES (Extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) NOT NULL PRIMARY KEY,
  user_name TEXT,
  phone TEXT UNIQUE,
  role user_role DEFAULT 'user',
  credit_balance NUMERIC DEFAULT 0,
  location_lat FLOAT8,
  location_long FLOAT8,
  bio TEXT,
  email TEXT,
  profile_image TEXT,
  category_id UUID, -- FK (Added later)
  sub_category_id UUID, -- FK (Added later)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUB_CATEGORIES
CREATE TABLE sub_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Foreign Keys to Profiles now that tables exist
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_category FOREIGN KEY (category_id) REFERENCES categories(id);
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_sub_category FOREIGN KEY (sub_category_id) REFERENCES sub_categories(id);

-- 5. SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES profiles(id) NOT NULL,
  payment_id TEXT,
  amount_paid NUMERIC,
  status subscription_status DEFAULT 'pending',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. LEADS
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES profiles(id) NOT NULL,
  category_id UUID REFERENCES categories(id),
  sub_category_id UUID REFERENCES sub_categories(id),
  title TEXT,
  description TEXT,
  images TEXT[],
  location_lat FLOAT8,
  location_long FLOAT8,
  address TEXT,
  amount NUMERIC,
  status lead_status DEFAULT 'open',
  claimed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. LEAD PROGRESS LOGS
CREATE TABLE lead_progress_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id),
  stage_msg TEXT,
  status log_status,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. WHATSAPP MESSAGES (AI Analysis)
CREATE TABLE whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  new_msg TEXT,
  sender_phone TEXT,
  group_id TEXT,
  whatsapp_msg_id TEXT UNIQUE,
  personal_data JSONB,
  confidence_score FLOAT8,
  status TEXT DEFAULT 'processing',
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, User update own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Categories/SubCategories: Public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "SubCategories are viewable by everyone" ON sub_categories FOR SELECT USING (true);

-- Leads: Customers see own, Providers see relevant
CREATE POLICY "Users see own leads" ON leads FOR SELECT USING (auth.uid() = customer_id);
-- Note: 'Providers see open' logic is simplified here. In prod, you check if user.role = 'provider'.
CREATE POLICY "Anyone can see open leads" ON leads FOR SELECT USING (status = 'open'); 
CREATE POLICY "Users can insert leads" ON leads FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can update leads (claim)" ON leads FOR UPDATE USING (true); -- Needs stricter checks in logic/functions

-- WhatsApp: Admin only (typically) or System
CREATE POLICY "System/Admin manages whatsapp" ON whatsapp_messages FOR ALL USING (true); -- Simplified

-- 10. Triggers for Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_whatsapp_messages_updated_at BEFORE UPDATE ON whatsapp_messages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
