import { supabase } from '@/lib/supabase';
import { Plan, Addon, AuditLog, Doctor } from '@/types/admin';

export class SupabaseAdminRepository {
  async listPlans(): Promise<Plan[]> {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) throw error;

    return data.map((p: any) => ({
      id: p.id,
      nome: p.name,
      tier: p.type,
      valor: p.price,
      limites: {
        maxPacientes: p.limits?.max_patients || null,
        maxProntuarios: p.limits?.max_medical_records || null,
        maxUsuarios: p.limits?.max_users || 1,
      },
      recursos: p.features?.map((f: string) => ({ key: f, label: f, enabled: true })) || [],
      ativo: p.active,
      assinantes: 0, // Need to count clients using this plan
      subtitle: p.subtitle,
      highlighted: p.highlighted,
      marketing_features: p.marketing_features || [],
    }));
  }

  async updatePlan(plan: Plan): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .update({
        name: plan.nome,
        price: plan.valor,
        limits: {
          max_patients: plan.limites.maxPacientes,
          max_medical_records: plan.limites.maxProntuarios,
          max_users: plan.limites.maxUsuarios,
        },
        features: plan.recursos.filter(r => r.enabled).map(r => r.key),
        active: plan.ativo,
        subtitle: plan.subtitle,
        highlighted: plan.highlighted,
        marketing_features: plan.marketing_features,
      })
      .eq('id', plan.id);

    if (error) throw error;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'assinantes'>): Promise<Plan> {
    const { data, error } = await supabase
      .from('plans')
      .insert({
        name: plan.nome,
        type: plan.tier, // Assuming tier maps to type
        price: plan.valor,
        limits: {
          max_patients: plan.limites.maxPacientes,
          max_medical_records: plan.limites.maxProntuarios,
          max_users: plan.limites.maxUsuarios,
        },
        features: plan.recursos.filter(r => r.enabled).map(r => r.key),
        active: plan.ativo,
        subtitle: plan.subtitle,
        highlighted: plan.highlighted,
        marketing_features: plan.marketing_features,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.name,
      tier: data.type,
      valor: data.price,
      limites: {
        maxPacientes: data.limits?.max_patients || null,
        maxProntuarios: data.limits?.max_medical_records || null,
        maxUsuarios: data.limits?.max_users || 1,
      },
      recursos: data.features?.map((f: string) => ({ key: f, label: f, enabled: true })) || [],
      ativo: data.active,
      assinantes: 0,
      subtitle: data.subtitle,
      highlighted: data.highlighted,
      marketing_features: data.marketing_features || [],
    };
  }

  async deletePlan(id: string): Promise<void> {
    const { error } = await supabase
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async listAddons(): Promise<Addon[]> {
    const { data, error } = await supabase
      .from('addons')
      .select('*');

    if (error) {
      // If table doesn't exist yet, return empty or handle error
      console.error('Error fetching addons:', error);
      return [];
    }

    return data.map((a: any) => ({
      id: a.id,
      nome: a.name,
      slug: a.slug,
      descricao: a.description,
      valor: a.price,
      icon: a.icon,
      ativo: a.active,
      assinantes: 0, // Need to count
      categoria: a.category,
    }));
  }

  async updateAddon(addon: Addon): Promise<void> {
    const { error } = await supabase
      .from('addons')
      .update({
        name: addon.nome,
        slug: addon.slug,
        description: addon.descricao,
        price: addon.valor,
        active: addon.ativo,
      })
      .eq('id', addon.id);

    if (error) throw error;
  }

  async createAddon(addon: Omit<Addon, 'id' | 'assinantes'>): Promise<Addon> {
    const { data, error } = await supabase
      .from('addons')
      .insert({
        name: addon.nome,
        slug: addon.slug,
        description: addon.descricao,
        price: addon.valor,
        icon: addon.icon,
        active: addon.ativo,
        category: addon.categoria,
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      nome: data.name,
      slug: data.slug,
      descricao: data.description,
      valor: data.price,
      icon: data.icon,
      ativo: data.active,
      assinantes: 0,
      categoria: data.category,
    };
  }

  async listAuditLogs(): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data.map((l: any) => ({
      id: l.id,
      adminId: l.admin_id,
      adminNome: l.admin_name,
      doctorId: l.target_id,
      doctorNome: l.target_name,
      acao: l.action,
      detalhes: l.details,
      valorAnterior: l.old_value,
      valorNovo: l.new_value,
      criadoEm: new Date(l.created_at),
    }));
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'criadoEm'>): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        admin_id: log.adminId,
        admin_name: log.adminNome,
        target_id: log.doctorId,
        target_name: log.doctorNome,
        action: log.acao,
        details: log.detalhes,
        old_value: log.valorAnterior,
        new_value: log.valorNovo,
      });

    if (error) console.error('Error creating audit log:', error);
  }

  // Helper to fetch real clients and map to Doctors
  async listDoctors(): Promise<Doctor[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        plans ( name, type ),
        client_addons ( addon_slug, status )
      `);

    if (error) throw error;

    return (data || []).map((c: any) => ({
      id: c.id,
      nome: c.name || c.email,
      email: c.email,
      crp: '', // Not in client table yet
      telefone: '',
      status: c.status === 'active' ? 'ativo' : c.status === 'blocked' ? 'bloqueado' : 'suspenso',
      plano: c.plans?.type || 'basico',
      modules: c.modules || { agenda: true, financeiro: true, whatsapp: true, relatorios: true, prontuario: true },
      addons: c.client_addons?.filter((ca: any) => ca.status === 'active').map((ca: any) => ca.addon_slug) || [],
      ultimoAcesso: new Date(c.updated_at),
      criadoEm: new Date(c.created_at),
    }));
  }

  async updateClientStatus(id: string, status: string): Promise<void> {
    const dbStatus = status === 'ativo' ? 'active' : status === 'bloqueado' ? 'blocked' : 'inactive';
    const { error } = await supabase
      .from('clients')
      .update({ status: dbStatus })
      .eq('id', id);

    if (error) throw error;
  }

  async updateClientPlan(id: string, planName: string): Promise<void> {
    // Find plan ID by name or tier
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .select('id')
      .or(`name.eq.${planName},type.eq.${planName}`) // Try to match name or type
      .single();
    
    if (planError) throw planError;
    if (!plan) throw new Error('Plan not found');

    const { error } = await supabase
      .from('clients')
      .update({ plan_id: plan.id })
      .eq('id', id);

    if (error) throw error;
  }

  async updateClientModules(id: string, modules: any): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ modules })
      .eq('id', id);

    if (error) throw error;
  }

  async updateClientLimits(id: string, limits: any): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({ custom_limits: limits })
      .eq('id', id);

    if (error) throw error;
  }

  async addClientAddon(clientId: string, addonSlug: string): Promise<void> {
    const { error } = await supabase
      .from('client_addons')
      .upsert({ 
        client_id: clientId, 
        addon_slug: addonSlug, 
        status: 'active' 
      }, { onConflict: 'client_id, addon_slug' });

    if (error) throw error;
  }

  async removeClientAddon(clientId: string, addonSlug: string): Promise<void> {
    const { error } = await supabase
      .from('client_addons')
      .delete()
      .match({ client_id: clientId, addon_slug: addonSlug });

    if (error) throw error;
  }

  async deleteClient(id: string): Promise<void> {
    // Check if user is admin is handled by RLS/policies
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Also delete from auth.users? Usually not possible from client SDK unless using service role.
    // Admin user via client SDK can only delete from public tables if RLS allows.
    // Deleting auth user requires backend function.
    // We will assume "soft delete" or just deleting client record which cascades to patients.
    // But auth user remains. To fully delete, we'd need an Edge Function.
    // For now, let's stick to client record deletion.
  }
}
