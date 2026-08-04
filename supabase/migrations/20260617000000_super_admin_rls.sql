-- 1. Süper Admin Kontrol Fonksiyonu Tanımlama
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  -- Giriş yapan kullanıcının e-posta adresi bu ikisinden biriyse TRUE döner
  RETURN coalesce(auth.jwt() ->> 'email', '') IN ('admin@bulutgrup.tr', 'root@bulutgrup.tr');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Eski Politikaları Kaldırma ve Yeni Süper Admin Destekli Politikaları Tanımlama

-- --- TENANTS ---
DROP POLICY IF EXISTS tenant_read_own ON public.tenants;
CREATE POLICY tenant_read_own ON public.tenants
    FOR SELECT USING (id = public.get_user_tenant() OR public.is_super_admin());

DROP POLICY IF EXISTS tenant_update_own ON public.tenants;
CREATE POLICY tenant_update_own ON public.tenants
    FOR UPDATE USING (id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (id = public.get_user_tenant() OR public.is_super_admin());

-- --- PROFILES ---
DROP POLICY IF EXISTS profile_select_same_tenant ON public.profiles;
CREATE POLICY profile_select_same_tenant ON public.profiles
    FOR SELECT USING (tenant_id = public.get_user_tenant() OR public.is_super_admin());

DROP POLICY IF EXISTS profile_update_own ON public.profiles;
CREATE POLICY profile_update_own ON public.profiles
    FOR UPDATE USING (id = auth.uid() OR public.is_super_admin()) 
    WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- --- PROJECTS ---
DROP POLICY IF EXISTS projects_all_policy ON public.projects;
CREATE POLICY projects_all_policy ON public.projects
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- TASKS ---
DROP POLICY IF EXISTS tasks_all_policy ON public.tasks;
CREATE POLICY tasks_all_policy ON public.tasks
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- CUSTOMERS ---
DROP POLICY IF EXISTS customers_all_policy ON public.customers;
CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- OFFERS ---
DROP POLICY IF EXISTS offers_all_policy ON public.offers;
CREATE POLICY offers_all_policy ON public.offers
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- FINANCE TRANSACTIONS ---
DROP POLICY IF EXISTS finance_all_policy ON public.finance_transactions;
CREATE POLICY finance_all_policy ON public.finance_transactions
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- SERVICE TICKETS ---
DROP POLICY IF EXISTS service_all_policy ON public.service_tickets;
CREATE POLICY service_all_policy ON public.service_tickets
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- WHOLESALE VENDORS ---
DROP POLICY IF EXISTS wholesale_all_policy ON public.wholesale_vendors;
CREATE POLICY wholesale_all_policy ON public.wholesale_vendors
    FOR ALL USING (tenant_id = public.get_user_tenant() OR public.is_super_admin()) 
    WITH CHECK (tenant_id = public.get_user_tenant() OR public.is_super_admin());

-- --- MESSAGES ---
DROP POLICY IF EXISTS messages_all_policy ON public.messages;
CREATE POLICY messages_all_policy ON public.messages
    FOR ALL USING (
        (tenant_id = public.get_user_tenant() AND (sender_id = auth.uid() OR receiver_id = auth.uid() OR receiver_id IS NULL)) 
        OR public.is_super_admin()
    ) WITH CHECK (
        (tenant_id = public.get_user_tenant() AND sender_id = auth.uid()) 
        OR public.is_super_admin()
    );
