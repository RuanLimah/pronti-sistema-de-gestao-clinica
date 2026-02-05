import { supabase } from '@/lib/supabase';
import { AdminClient, AdminPlan, AdminAddon, AdminAuditLog, AdminStats } from '../types';

export const adminService = {
  // --- Stats ---
  async getStats(): Promise<AdminStats> {
    // Total Clients
    const { count: totalClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    // Active Clients
    const { count: activeClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Free Clients
    const { count: freeClients } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'free');

    // Revenue Calculation (simplified: sum of active plans + active addons)
    // This is complex to do in one query without a view/function. 
    // For now, we fetch active clients with plans and sum up in JS (if dataset is small) 
    // or assume we have a 'revenue' view.
    // Given the constraints, let's fetch active clients with their plans and addons.
    
    const { data: revenueData } = await supabase
      .from('clients')
      .select(`
        plan_id,
        plans ( price ),
        client_addons (
          addons ( price )
        )
      `)
      .eq('status', 'active');

    let monthlyRevenue = 0;
    if (revenueData) {
      revenueData.forEach((client: any) => {
        if (client.plans?.price) {
          monthlyRevenue += Number(client.plans.price);
        }
        if (client.client_addons) {
          client.client_addons.forEach((ca: any) => {
             if (ca.addons?.price) {
               monthlyRevenue += Number(ca.addons.price);
             }
          });
        }
      });
    }

    return {
      totalClients: totalClients || 0,
      activeClients: activeClients || 0,
      freeClients: freeClients || 0,
      monthlyRevenue,
    };
  },

  // --- Clients ---
  // Returns raw response for better error handling in UI
  async getClientsResponse() {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      return { data: null, error: { message: "No active session token" } };
    }

    return await supabase.functions.invoke('admin-users', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  },

  async getClients(): Promise<AdminClient[]> {
    const { data, error } = await this.getClientsResponse();

    if (error) {
      console.error("Admin Service Error:", error);
      throw error;
    }
    return data as AdminClient[];
  },

  async updateClientProfile(userId: string, updates: { nome?: string; telefone?: string; plano?: string }): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        nome: updates.nome,
        telefone: updates.telefone,
        plano: updates.plano
      })
      .eq('id', userId);

    if (error) throw error;
  },

  async deleteClient(userId: string): Promise<void> {
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) throw new Error("No active session token");

    const { error } = await supabase.functions.invoke('admin-delete-user', {
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: { user_id: userId }
    });

    if (error) throw error;
  },

  // --- Plans (Direct DB Access) ---
  async getPlans(): Promise<AdminPlan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data as AdminPlan[];
  },

  async createPlan(plan: Omit<AdminPlan, 'id'>): Promise<void> {
    const { data, error } = await supabase
      .from('plans')
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    await this.logAction('CREATE', 'plan', data.id, plan);
  },

  async updatePlan(id: string, plan: Partial<AdminPlan>): Promise<void> {
    // Logic for highlighted plan: if this plan is being highlighted, unhighlight others
    if (plan.highlighted) {
      // First unhighlight all others (best effort, ideally a transaction or function but client-side is okay for now)
      await supabase
        .from('plans')
        .update({ highlighted: false })
        .neq('id', id);
    }

    const { error } = await supabase
      .from('plans')
      .update(plan)
      .eq('id', id);

    if (error) throw error;
    await this.logAction('UPDATE', 'plan', id, plan);
  },

  async deletePlan(id: string): Promise<void> {
    const { error, count } = await supabase
      .from('plans')
      .delete({ count: 'exact' })
      .eq('id', id);

    if (error) throw error;
    if (count === 0) {
      throw new Error("Falha ao excluir plano (nenhum registro afetado). Verifique permissões.");
    }
    await this.logAction('DELETE', 'plan', id, {});
  },

  // --- Addons (Direct DB Access) ---
  async getAddons(): Promise<AdminAddon[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;
    return data as AdminAddon[];
  },

  async createAddon(addon: Omit<AdminAddon, 'id'>): Promise<void> {
    const { data, error } = await supabase
      .from('addons')
      .insert(addon)
      .select()
      .single();

    if (error) throw error;
    await this.logAction('CREATE', 'addon', data.id, addon);
  },

  async updateAddon(id: string, addon: Partial<AdminAddon>): Promise<void> {
    const { error } = await supabase
      .from('addons')
      .update(addon)
      .eq('id', id);

    if (error) throw error;
    await this.logAction('UPDATE', 'addon', id, addon);
  },

  async deleteAddon(id: string): Promise<void> {
    // Check dependencies (client_addons) handled by DB constraints or check first
    // Since we use ON DELETE CASCADE in the migration, it should be fine, 
    // but user might want to prevent deletion if used.
    // Let's check if any client uses it.
    const { count } = await supabase
      .from('client_addons')
      .select('*', { count: 'exact', head: true })
      .eq('addon_id', id);

    if (count && count > 0) {
      throw new Error('Cannot delete addon with active subscriptions');
    }

    const { error } = await supabase
      .from('addons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.logAction('DELETE', 'addon', id, {});
  },

  // --- Audit ---
  async getAuditLogs(limit = 50): Promise<AdminAuditLog[]> {
    const { data, error } = await supabase
      .from('auditoria')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as AdminAuditLog[];
  },

  // --- Client Addons (Direct DB Access) ---
  async getClientAddons(clientId: string) {
    const { data, error } = await supabase
      .from('client_addons')
      .select(`
        id,
        active,
        created_at,
        addon:addons (
          id,
          name,
          price,
          slug
        )
      `)
      .eq('client_id', clientId);

    if (error) throw error;
    return data;
  },

  async addClientAddon(clientId: string, addonId: string) {
    // Check if already exists to avoid duplicates (although DB constraint might handle unique pair?)
    // My migration didn't explicitly set unique constraint on (client_id, addon_id), but logic should prevent it.
    // Let's check first.
    const { data: existing } = await supabase
      .from('client_addons')
      .select('id')
      .eq('client_id', clientId)
      .eq('addon_id', addonId)
      .maybeSingle();

    if (existing) {
      throw new Error('Addon already assigned to client');
    }

    const { data, error } = await supabase
      .from('client_addons')
      .insert({ client_id: clientId, addon_id: addonId, active: true })
      .select()
      .single();

    if (error) throw error;
    await this.logAction('ADD_ADDON', 'client', clientId, { addon_id: addonId });
    return data;
  },

  async removeClientAddon(id: string, clientId: string) { // clientId for audit log
    const { error } = await supabase
      .from('client_addons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    await this.logAction('REMOVE_ADDON', 'client', clientId, { client_addon_id: id });
  },

  async logAction(acao: string, entidade: string, entidade_id: string | null, detalhes: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('auditoria').insert({
      actor_id: user.id,
      acao,
      entidade,
      entidade_id,
      detalhes
    });
  }
};
