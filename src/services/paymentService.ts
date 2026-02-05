import { supabase } from "@/lib/supabase";

export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface PaymentStatus {
  id: string;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  external_reference: string;
}

class PaymentService {
  /**
   * Creates a checkout preference in Mercado Pago for a subscription
   */
  async createSubscriptionPreference(planId: string, userId: string): Promise<MercadoPagoPreference> {
    try {
      // In a real implementation, this would call a Supabase Edge Function
      // which would then talk to Mercado Pago API using the Access Token.
      // We are simulating the Edge Function call here.
      
      const { data, error } = await supabase.functions.invoke('create-checkout-preference', {
        body: { planId, userId },
      });

      if (error) {
        // Fallback for development/demo without Edge Functions deployed
        console.warn("Edge Function not available, using mock preference");
        return this.mockPreference(planId);
      }

      return data as MercadoPagoPreference;
    } catch (error) {
      console.error("Error creating preference:", error);
      throw error;
    }
  }

  private mockPreference(planId: string): MercadoPagoPreference {
    // Return a mock preference for testing UI flow
    return {
      id: `mock_pref_${Date.now()}`,
      init_point: `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${planId}`,
      sandbox_init_point: `https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mock_${planId}`,
    };
  }

  /**
   * Verifies payment status (usually called via webhook, but can be polled)
   */
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus | null> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', paymentId)
      .single();

    if (error) return null;
    return data;
  }
}

export const paymentService = new PaymentService();
