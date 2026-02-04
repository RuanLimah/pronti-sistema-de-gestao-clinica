import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CheckCircle, X, Star, Zap, Users, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  marketing_features: PlanFeature[];
  highlighted: boolean;
  type: string;
  cta?: string; // Optional, can be derived
}

interface Addon {
  id: string;
  name: string;
  price: number;
}

const getIcon = (type: string) => {
  switch (type) {
    case 'gratuito': return Zap;
    case 'essencial': return Star;
    case 'profissional': return Crown;
    case 'clinica': return Users;
    default: return Star;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case 'gratuito': return "slate";
    case 'essencial': return "emerald";
    case 'profissional': return "teal";
    case 'clinica': return "indigo";
    default: return "slate";
  }
};

const getCta = (type: string) => {
  switch (type) {
    case 'gratuito': return "Começar grátis";
    case 'essencial': return "Assinar Essencial";
    case 'profissional': return "Assinar Profissional";
    case 'clinica': return "Falar com vendas";
    default: return "Assinar";
  }
};

export function PricingSection() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: plansData } = await supabase
          .from('plans')
          .select('*')
          .eq('active', true)
          .order('price', { ascending: true });

        const { data: addonsData } = await supabase
          .from('addons')
          .select('*')
          .eq('active', true)
          .order('price', { ascending: true });

        if (plansData) setPlans(plansData);
        if (addonsData) setAddons(addonsData);
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <div className="py-20 text-center">Carregando planos...</div>;
  }

  return (
    <section id="planos" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">
            💰 Planos e Preços
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-muted-foreground text-lg">
            Comece grátis e evolua conforme sua clínica cresce
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-16">
          {plans.map((plan, index) => {
            const Icon = getIcon(plan.type);
            const color = getColor(plan.type);
            const cta = getCta(plan.type);
            const isPopular = plan.highlighted;

            return (
              <div
                key={plan.id}
                className={`relative bg-card rounded-2xl p-6 border-2 transition-all duration-300 animate-fade-in ${
                  isPopular 
                    ? "border-primary shadow-xl shadow-primary/20 scale-105 lg:scale-110 z-10" 
                    : "border-border hover:border-muted-foreground/30 hover:shadow-lg"
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1 text-sm shadow-lg">
                      ⭐ Mais popular
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                    isPopular 
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" 
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{plan.subtitle}</p>
                  <div className="mt-4">
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-4xl font-bold text-foreground mx-1">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.marketing_features && plan.marketing_features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    isPopular 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg" 
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                  onClick={() => navigate("/login?mode=signup")}
                >
                  {cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="font-display text-xl font-bold text-foreground">
              🔥 Add-ons Opcionais
            </h3>
            <p className="text-muted-foreground text-sm mt-1">
              Potencialize seu plano com recursos extras
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addons.map((addon, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-secondary/50 rounded-xl p-4 border border-border"
              >
                <span className="text-sm font-medium text-foreground">{addon.name}</span>
                <span className="text-sm font-bold text-primary">R$ {addon.price}/mês</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
