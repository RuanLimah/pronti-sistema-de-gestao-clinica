// User Interface
export type UserRole = 'admin' | 'medico';
export type UserStatus = 'ativo' | 'inadimplente' | 'bloqueado';

export interface User {
  id: string;
  nome: string;
  email: string;
  tipo: UserRole;
  status: UserStatus;
  foto?: string;
  crp?: string;
  telefone?: string;
  especialidades?: string;
  tipoProfissional?: 'Psicólogo' | 'Dentista' | 'Médico' | 'Outro';
  criadoEm: Date;
  atualizadoEm?: Date;
}
