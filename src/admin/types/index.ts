export type ClientStatus = 'free' | 'active' | 'suspended' | 'blocked';

export interface AdminClient {
  id: string;
  email: string;
  role: string;
  nome?: string;
  telefone?: string;
  plano?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface AdminPlan {
  id: string;
  name: string;
  price: number;
  active: boolean;
  highlighted: boolean;
  type: string;
  subtitle?: string;
  features?: string[];
  limits?: any;
  marketing_features?: any;
  created_at?: string;
}

export interface AdminAddon {
  id: string;
  name: string;
  price: number;
  active: boolean;
  slug: string;
  category?: string;
  created_at?: string;
}

export interface AdminAuditLog {
  id: string;
  actor_id: string;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  detalhes: any;
  created_at: string;
  // Join for display
  actor_email?: string;
}

export interface AdminStats {
  totalClients: number;
  activeClients: number;
  freeClients: number;
  monthlyRevenue: number;
}
