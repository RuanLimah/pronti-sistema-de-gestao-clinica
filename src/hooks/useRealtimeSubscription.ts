// ============= Hook de Realtime (preparado para Supabase) =============
// Este hook será ativado quando o Lovable Cloud estiver habilitado.
// Por enquanto, simula atualizações em tempo real usando o estado local.

import { useEffect, useCallback, useRef } from 'react';
import { useDataStore } from '@/stores/dataStore';

type TableName = 'pacientes' | 'atendimentos' | 'pagamentos' | 'prontuarios' | 'notificacoes' | 'configuracoes';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface RealtimePayload<T = unknown> {
  eventType: EventType;
  table: TableName;
  new: T | null;
  old: T | null;
}

interface SubscriptionOptions<T = unknown> {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: T) => void;
  onUpdate?: (payload: { new: T; old: T }) => void;
  onDelete?: (payload: T) => void;
  onChange?: (payload: RealtimePayload<T>) => void;
}

// Simulação de canal de eventos (será substituído por Supabase Realtime)
class MockRealtimeChannel {
  private listeners: Map<string, Set<(payload: RealtimePayload) => void>> = new Map();
  private static instance: MockRealtimeChannel | null = null;

  static getInstance(): MockRealtimeChannel {
    if (!MockRealtimeChannel.instance) {
      MockRealtimeChannel.instance = new MockRealtimeChannel();
    }
    return MockRealtimeChannel.instance;
  }

  subscribe(table: TableName, callback: (payload: RealtimePayload) => void): () => void {
    if (!this.listeners.has(table)) {
      this.listeners.set(table, new Set());
    }
    this.listeners.get(table)!.add(callback);

    // Retorna função de unsubscribe
    return () => {
      this.listeners.get(table)?.delete(callback);
    };
  }

  broadcast(table: TableName, payload: RealtimePayload): void {
    this.listeners.get(table)?.forEach(callback => callback(payload));
    // Broadcast para listeners globais
    this.listeners.get('*' as TableName)?.forEach(callback => callback(payload));
  }
}

// Canal global para broadcast de eventos
export const realtimeChannel = MockRealtimeChannel.getInstance();

// Hook principal para subscriptions
export function useRealtimeSubscription<T = unknown>(options: SubscriptionOptions<T>): void {
  const { table, event = '*', onInsert, onUpdate, onDelete, onChange } = options;
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onChange });

  // Atualizar refs quando callbacks mudam
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onChange };
  }, [onInsert, onUpdate, onDelete, onChange]);

  useEffect(() => {
    const handlePayload = (payload: RealtimePayload<T>) => {
      const { onInsert, onUpdate, onDelete, onChange } = callbacksRef.current;

      // Filtrar por tipo de evento se especificado
      if (event !== '*' && payload.eventType !== event) return;

      // Chamar callback genérico
      onChange?.(payload);

      // Chamar callbacks específicos
      switch (payload.eventType) {
        case 'INSERT':
          if (payload.new) onInsert?.(payload.new);
          break;
        case 'UPDATE':
          if (payload.new && payload.old) {
            onUpdate?.({ new: payload.new, old: payload.old as T });
          }
          break;
        case 'DELETE':
          if (payload.old) onDelete?.(payload.old as T);
          break;
      }
    };

    const unsubscribe = realtimeChannel.subscribe(table, handlePayload as (payload: RealtimePayload) => void);

    return unsubscribe;
  }, [table, event]);
}

// Hook para emitir eventos (usado pelo dataStore)
export function useRealtimeEmitter() {
  const emit = useCallback(<T>(table: TableName, eventType: EventType, data: { new?: T; old?: T }) => {
    realtimeChannel.broadcast(table, {
      eventType,
      table,
      new: data.new ?? null,
      old: data.old ?? null,
    });
  }, []);

  return { emit };
}

// Hook de conveniência para refetch automático
export function useRealtimeRefresh(
  table: TableName,
  refetchFn: () => void
): void {
  useRealtimeSubscription({
    table,
    onChange: () => {
      refetchFn();
    },
  });
}

// Hook específico para pacientes
export function usePacientesRealtime(medicoId: string) {
  const { getPacientesByMedico } = useDataStore();

  useRealtimeSubscription({
    table: 'pacientes',
    onChange: () => {
      // Estado é atualizado automaticamente pelo Zustand
      // Este hook pode ser expandido para lógica adicional
    },
  });

  return getPacientesByMedico(medicoId);
}

// Hook específico para atendimentos
export function useAtendimentosRealtime(medicoId: string) {
  const { getAtendimentosByMedico } = useDataStore();

  useRealtimeSubscription({
    table: 'atendimentos',
    onChange: () => {
      // Estado é atualizado automaticamente pelo Zustand
    },
  });

  return getAtendimentosByMedico(medicoId);
}

// Hook específico para pagamentos
export function usePagamentosRealtime(medicoId: string) {
  const { getPagamentosByMedico } = useDataStore();

  useRealtimeSubscription({
    table: 'pagamentos',
    onChange: () => {
      // Estado é atualizado automaticamente pelo Zustand
    },
  });

  return getPagamentosByMedico(medicoId);
}

// Hook específico para notificações
export function useNotificacoesRealtime(medicoId: string) {
  const { getNotificacoesByMedico, getNotificacoesNaoLidas } = useDataStore();

  useRealtimeSubscription({
    table: 'notificacoes',
    onChange: () => {
      // Estado é atualizado automaticamente pelo Zustand
    },
  });

  return {
    notificacoes: getNotificacoesByMedico(medicoId),
    naoLidas: getNotificacoesNaoLidas(medicoId),
  };
}

// ============= Notas de Implementação Futura =============
/*
Quando o Lovable Cloud (Supabase) estiver habilitado:

1. Substituir MockRealtimeChannel por:
   ```
   import { supabase } from '@/lib/supabase';
   
   const channel = supabase
     .channel('db-changes')
     .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
     .subscribe();
   ```

2. O dataStore deverá:
   - Fazer queries ao Supabase ao invés de estado local
   - Usar subscriptions para sincronizar estado
   - Implementar optimistic updates para UX fluida

3. Benefícios do Supabase Realtime:
   - Sync automático entre múltiplas abas/dispositivos
   - Broadcast de presença (quem está online)
   - Canais privados por médico
*/
