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
      { text: "WhatsApp", included: false },
      { text: "Relatórios", included: false },
      { text: "Prontuário completo", included: false },
    ],
    cta: "Começar grátis",
    popular: false,
  },
  {
    name: "Essencial",
    subtitle: "COMEÇAR",
    price: "49,90",
    icon: Star,
    color: "emerald",
    features: [
      { text: "Agenda completa", included: true },
      { text: "Até 50 pacientes ativos", included: true },
      { text: "Prontuário digital básico", included: true },
      { text: "Financeiro simples", included: true },
      { text: "WhatsApp manual", included: true },
      { text: "1 usuário", included: true },
      { text: "WhatsApp automático", included: false },
      { text: "Relatórios avançados", included: false },
    ],
    cta: "Assinar Essencial",
    popular: false,
  },
  {
    name: "Profissional",
    subtitle: "CRESCER",
    price: "99,90",
    icon: Crown,
    color: "teal",
    features: [
      { text: "Tudo do Essencial +", included: true },
      { text: "WhatsApp automático", included: true },
      { text: "Envio em massa", included: true },
      { text: "Lembretes automáticos", included: true },
      { text: "Prontuário completo", included: true },
      { text: "Financeiro completo", included: true },
      { text: "Relatórios PDF", included: true },
      { text: "Até 300 pacientes", included: true },
    ],
    cta: "Assinar Profissional",
    popular: true,
  },
  {
    name: "Clínica",
    subtitle: "ESCALAR",
    price: "199,90",
    icon: Users,
    color: "indigo",
    features: [
      { text: "Tudo do Profissional +", included: true },
      { text: "Múltiplos profissionais", included: true },
      { text: "Controle de permissões", included: true },
      { text: "Relatórios por profissional", included: true },
      { text: "Financeiro consolidado", included: true },
      { text: "Pacientes ilimitados", included: true },
      { text: "Suporte prioritário", included: true },
    ],
    cta: "Assinar Clínica",
    popular: false,
  },
];

const addOns = [
  { name: "WhatsApp Automático Avançado", price: "29,90" },
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
            Comece grátis e evolua conforme seu consultório cresce
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
                    ⭐ Mais vendido
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
                onClick={() => navigate("/login")}
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
