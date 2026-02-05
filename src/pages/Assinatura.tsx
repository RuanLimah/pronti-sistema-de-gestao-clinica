import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PlanCard } from "@/components/subscription/PlanCard";
import { PLANOS, PlanTier } from "@/types/plans";
import { useAuthStore } from "@/stores/authStore";
import { useSubscriptionStore } from "@/stores/subscriptionStore";
import { paymentService } from "@/services/paymentService";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, CheckCircle, AlertCircle } from "lucide-react";

export default function Assinatura() {
  const { user } = useAuthStore();
  const { getSubscription, initializeSubscription } = useSubscriptionStore();
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Ensure user has a subscription record (even if free/trial)
  useEffect(() => {
    if (user?.id) {
      const sub = getSubscription(user.id);
      if (!sub) {
        initializeSubscription(user.id);
      }
    }
  }, [user?.id, getSubscription, initializeSubscription]);

  // Handle Payment Return
  useEffect(() => {
    const status = searchParams.get('status');
    const paymentId = searchParams.get('payment_id');

    if (status === 'approved') {
      toast({
        title: "Pagamento aprovado!",
        description: `Sua assinatura foi ativada com sucesso. (ID: ${paymentId})`,
        duration: 5000,
      });
      // Clear params
      setSearchParams({});
      
      // Force refresh subscription data
      if (user?.id) {
         initializeSubscription(user.id); // Or a refresh function
      }

    } else if (status === 'failure' || status === 'rejected') {
      toast({
        title: "Pagamento falhou",
        description: "O pagamento não foi processado. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      });
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, user?.id, initializeSubscription]);

  const currentSubscription = user?.id ? getSubscription(user.id) : undefined;
  const currentTier = currentSubscription?.plano.tier || 'gratuito';

  const handleSubscribe = async (tier: PlanTier) => {
    if (!user?.id) return;
    if (tier === currentTier) return;
    
    setLoadingTier(tier);
    try {
      const planId = PLANOS[tier].id;
      
      // Create preference in Mercado Pago
      const preference = await paymentService.createSubscriptionPreference(planId, user.id);
      
      // Redirect to checkout
      if (preference && preference.init_point) {
         window.location.href = preference.init_point;
      } else {
         throw new Error("Invalid preference URL");
      }
      
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Erro ao iniciar assinatura",
        description: "Não foi possível conectar com o Mercado Pago. Tente novamente.",
        variant: "destructive",
      });
      setLoadingTier(null);
    }
  };

  return (
    <DashboardLayout title="Assinatura" subtitle="Gerencie seu plano e recursos">
      <div className="space-y-8 animate-fade-in">
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Status da Assinatura</AlertTitle>
          <AlertDescription>
            Você está atualmente no plano <strong>{PLANOS[currentTier].nome}</strong>.
            {currentSubscription?.status === 'trial' && (
              <span className="block mt-1 text-warning-dark font-medium">
                Período de testes termina em {currentSubscription.trialFim ? new Date(currentSubscription.trialFim).toLocaleDateString() : 'breve'}.
              </span>
            )}
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {(Object.values(PLANOS) as any[]).sort((a, b) => a.ordem - b.ordem).map((plan) => (
            <div key={plan.id} className="relative">
               <PlanCard 
                 plan={plan} 
                 currentTier={currentTier}
                 isLoading={loadingTier === plan.tier}
                 onSelect={handleSubscribe}
               />
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
           <p>Pagamentos processados com segurança pelo Mercado Pago.</p>
           <p>Você pode cancelar sua assinatura a qualquer momento.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
