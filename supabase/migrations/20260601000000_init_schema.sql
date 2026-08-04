-- 1. Eklentilerin ve Şemaların Hazırlanması
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tablo Tanımları

-- Müşteri İşletmeler (Tenants)
CREATE TABLE public.tenants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    owner_id uuid, -- Kayıt olan ilk yöneticinin ID'si (auth.users ID)
    status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended')),
    plan_type text NOT NULL DEFAULT 'kobi' CHECK (plan_type IN ('kobi', 'profesyonel', 'kurumsal')),
    billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    subscription_ends_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
    gift_months integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Kullanıcı Profilleri (Profiles)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY, -- auth.users ID'si ile eşleşecek
    tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name text,
    phone text,
    role text NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Projeler (Projects)
CREATE TABLE public.projects (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
    start_date date,
    end_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Görevler (Tasks)
CREATE TABLE public.tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
    title text NOT NULL,
    description text,
    assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'approved')),
    priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Müşteriler (Customers)
CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Teklifler (Offers)
CREATE TABLE public.offers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    title text NOT NULL,
    content jsonb NOT NULL DEFAULT '[]'::jsonb,
    total_amount numeric(12,2) NOT NULL DEFAULT 0.00,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Finans Hareketleri (Finance Transactions)
CREATE TABLE public.finance_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('income', 'expense')),
    category text NOT NULL CHECK (category IN ('bank', 'check', 'invoice', 'other')),
    amount numeric(12,2) NOT NULL DEFAULT 0.00,
    description text,
    transaction_date date NOT NULL DEFAULT CURRENT_DATE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Teknik Servis Listesi (Service Tickets)
CREATE TABLE public.service_tickets (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    assigned_staff_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    issue_description text NOT NULL,
    status text NOT NULL DEFAULT 'unresolved' CHECK (status IN ('unresolved', 'resolved')),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Toptancılar / Tedarikçiler (Wholesale Vendors)
CREATE TABLE public.wholesale_vendors (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    company_name text NOT NULL,
    contact_name text,
    email text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Mesajlaşma (Messages)
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL ise genel/grup mesajıdır
    subject text,
    body text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    is_online_chat boolean DEFAULT false NOT NULL, -- Anlık mesajlaşma mı
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


-- 3. Tetikleyiciler (Triggers) & Yardımcı Fonksiyonlar

-- Yeni Auth Kaydında Otomatik Profil Oluşturma Tetikleyicisi
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    v_tenant_id uuid;
    v_tenant_name text;
    v_slug text;
    v_full_name text;
    v_phone text;
BEGIN
    -- Metadata'dan şirket ve kullanıcı bilgilerini al
    v_tenant_name := coalesce(new.raw_user_meta_data->>'company_name', 'Yeni İşletme');
    v_slug := coalesce(new.raw_user_meta_data->>'slug', 'isletme-' || lower(substring(new.id::text from 1 for 8)));
    v_full_name := coalesce(new.raw_user_meta_data->>'full_name', 'Yetkili Kullanıcı');
    v_phone := new.raw_user_meta_data->>'phone';

    -- Eğer tenant_id meta data'da yoksa yeni bir tenant (şirket) oluştur
    IF new.raw_user_meta_data->>'tenant_id' IS NULL THEN
        INSERT INTO public.tenants (name, slug, owner_id, status, plan_type, billing_cycle)
        VALUES (v_tenant_name, v_slug, new.id, 'trial', 'kobi', 'monthly')
        RETURNING id INTO v_tenant_id;
    ELSE
        v_tenant_id := (new.raw_user_meta_data->>'tenant_id')::uuid;
    END IF;

    -- Kullanıcı profilini oluştur
    INSERT INTO public.profiles (id, tenant_id, full_name, phone, role, is_active)
    VALUES (
        new.id,
        v_tenant_id,
        v_full_name,
        v_phone,
        CASE WHEN new.raw_user_meta_data->>'tenant_id' IS NULL THEN 'admin'::text ELSE 'staff'::text END,
        true
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı auth.users tablosuna ekle
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 4. Row Level Security (RLS) Tanımlamaları

-- RLS Etkinleştirme
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wholesale_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Aktif kullanıcının tenant_id'sini dönen pratik yardımcı fonksiyon
CREATE OR REPLACE FUNCTION public.get_user_tenant()
RETURNS uuid AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Politikaları

-- Tenants RLS: Kullanıcı sadece kendi şirket kaydını okuyabilir/güncelleyebilir
CREATE POLICY tenant_read_own ON public.tenants
    FOR SELECT USING (id = public.get_user_tenant());

CREATE POLICY tenant_update_own ON public.tenants
    FOR UPDATE USING (id = public.get_user_tenant()) WITH CHECK (id = public.get_user_tenant());

-- Profiles RLS: Aynı şirketteki profilleri listeleme ve kendi profilini güncelleme
CREATE POLICY profile_select_same_tenant ON public.profiles
    FOR SELECT USING (tenant_id = public.get_user_tenant());

CREATE POLICY profile_update_own ON public.profiles
    FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Projects RLS: Multi-tenant izolasyonu
CREATE POLICY projects_all_policy ON public.projects
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Tasks RLS: Multi-tenant izolasyonu
CREATE POLICY tasks_all_policy ON public.tasks
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Customers RLS: Multi-tenant izolasyonu
CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Offers RLS: Multi-tenant izolasyonu
CREATE POLICY offers_all_policy ON public.offers
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Finance Transactions RLS: Multi-tenant izolasyonu
CREATE POLICY finance_all_policy ON public.finance_transactions
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Service Tickets RLS: Multi-tenant izolasyonu
CREATE POLICY service_all_policy ON public.service_tickets
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Wholesale Vendors RLS: Multi-tenant izolasyonu
CREATE POLICY wholesale_all_policy ON public.wholesale_vendors
    FOR ALL USING (tenant_id = public.get_user_tenant()) WITH CHECK (tenant_id = public.get_user_tenant());

-- Messages RLS: Gönderen veya alıcı olan mesajları ve aynı tenant içindeki grup konuşmalarını okuma
CREATE POLICY messages_all_policy ON public.messages
    FOR ALL USING (
        tenant_id = public.get_user_tenant() AND 
        (sender_id = auth.uid() OR receiver_id = auth.uid() OR receiver_id IS NULL)
    ) WITH CHECK (
        tenant_id = public.get_user_tenant() AND sender_id = auth.uid()
    );

-- 5. Tetikleyici: Yeni Tenant Eklendiğinde Edge Function'ı Tetikle (HTTP Webhook)
CREATE OR REPLACE FUNCTION public.trigger_signup_notification()
RETURNS trigger AS $$
BEGIN
  BEGIN
    -- pg_net kullanarak Edge Function'a HTTP POST isteği gönderir
    -- Exception bloğu sayesinde pg_net veya URL hataları üye kaydını (signup) asla engellemez!
    PERFORM
      net.http_post(
        url := 'https://tcigxuhsaizzfukfbtxi.supabase.co/functions/v1/signup-notification', -- Canlı Edge Function URL
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'type', 'INSERT',
          'table', 'tenants',
          'record', row_to_json(new)
        ),
        timeout_milliseconds := 5000
      );
  EXCEPTION WHEN OTHERS THEN
    -- Hata durumunda işlemi durdurma, sadece logla
    RAISE WARNING 'Edge Function tetiklenirken hata oluştu: %', SQLERRM;
  END;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_tenant_signup
    AFTER INSERT ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.trigger_signup_notification();

