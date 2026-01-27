import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { CheckCircle, X, Star, Zap, Users, Crown } from "lucide-react";

const plans = [
  {
    name: "Gratuito",
    subtitle: "Para conhecer",
    price: "0",
    icon: Zap,
    color: "slate",
    features: [
      { text: "Agenda básica", included: true },
      { text: "Até 10 pacientes", included: true },
      { text: "10 atendimentos/mês", included: true },
      { text: "Prontuário básico", included: true },
      { text: "Financeiro", included: false },
      { text: "Relatórios", included: false },
    ],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Essencial",
    subtitle: "COMEÇAR",
    price: "79",
    icon: Star,
    color: "emerald",
    features: [
      { text: "Agenda completa", included: true },
      { text: "Até 50 pacientes", included: true },
      { text: "Prontuário digital", included: true },
      { text: "Financeiro básico", included: true },
      { text: "Relatórios simples", included: true },
      { text: "Suporte por email", included: true },
      { text: "Auditoria", included: false },
      { text: "Exportação PDF", included: false },
    ],
    cta: "Assinar Essencial",
    popular: false,
  },
  {
    name: "Profissional",
    subtitle: "CRESCER",
    price: "149",
    icon: Crown,
    color: "teal",
    features: [
      { text: "Tudo do Essencial +", included: true },
      { text: "Pacientes ilimitados", included: true },
      { text: "Financeiro avançado", included: true },
      { text: "Relatórios completos", included: true },
      { text: "Exportação PDF", included: true },
      { text: "Auditoria completa", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    cta: "Assinar Profissional",
    popular: true,
  },
  {
    name: "Clínica",
    subtitle: "ESCALAR",
    price: "299",
    icon: Users,
    color: "indigo",
    features: [
      { text: "Tudo do Profissional +", included: true },
      { text: "Múltiplos profissionais", included: true },
      { text: "Gestão de equipe", included: true },
      { text: "Relatórios gerenciais", included: true },
      { text: "API de integração", included: true },
      { text: "Suporte dedicado", included: true },
      { text: "Treinamento incluso", included: true },
    ],
    cta: "Falar com vendas",
    popular: false,
  },
];

const addOns = [
  { name: "WhatsApp Automático", price: "29,90" },
  { name: "Armazenamento Extra", price: "19,90" },
  { name: "Relatórios Avançados", price: "14,90" },
];

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section id="planos" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wide">
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
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 animate-fade-in ${
                plan.popular 
                  ? "border-emerald-500 shadow-xl shadow-emerald-500/20 scale-105 lg:scale-110 z-10" 
                  : "border-slate-200 hover:border-slate-300 hover:shadow-lg"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-1 text-sm shadow-lg">
                    ⭐ Mais popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-6">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${
                  plan.popular 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white" 
                    : "bg-slate-100 text-slate-600"
                }`}>
                  <plan.icon className="h-6 w-6" />
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
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300 flex-shrink-0" />
                    )}
                    <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${
                  plan.popular 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg" 
                    : "bg-slate-100 text-foreground hover:bg-slate-200"
                }`}
                onClick={() => navigate("/login?mode=signup")}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
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
            {addOns.map((addon, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-slate-50 rounded-xl p-4 border border-slate-100"
              >
                <span className="text-sm font-medium text-foreground">{addon.name}</span>
                <span className="text-sm font-bold text-emerald-600">R$ {addon.price}/mês</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
