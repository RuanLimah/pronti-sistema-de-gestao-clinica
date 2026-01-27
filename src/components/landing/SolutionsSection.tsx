import { 
  Calendar, 
  FileText, 
  Users, 
  DollarSign, 
  BarChart3, 
  Shield,
  CheckCircle
} from "lucide-react";

const solutions = [
  {
    icon: Calendar,
    title: "Agenda Inteligente",
    description: "Organize consultas, bloqueie horários e tenha visão clara da sua semana.",
    features: ["Confirmação de consultas", "Bloqueio de horários", "Visualização mensal/semanal"],
  },
  {
    icon: Users,
    title: "Gestão de Pacientes",
    description: "Cadastro completo com histórico e informações sempre acessíveis.",
    features: ["Cadastro completo", "Busca rápida", "Histórico de atendimentos"],
  },
  {
    icon: FileText,
    title: "Prontuário Digital Seguro",
    description: "Evoluções, anexos de exames e histórico protegidos com criptografia.",
    features: ["Evoluções ilimitadas", "Upload de documentos", "Acesso controlado"],
  },
  {
    icon: DollarSign,
    title: "Controle Financeiro",
    description: "Controle pagamentos, inadimplência e faturamento em tempo real.",
    features: ["Relatórios financeiros", "Controle de pagamentos", "Previsão de receita"],
  },
  {
    icon: BarChart3,
    title: "Relatórios Completos",
    description: "Gere relatórios profissionais para análise e tomada de decisões.",
    features: ["Relatórios personalizados", "Exportação em PDF", "Gráficos detalhados"],
  },
  {
    icon: Shield,
    title: "Auditoria e Segurança",
    description: "Rastreie todas as ações no sistema com logs de auditoria completos.",
    features: ["Logs de acesso", "Controle de permissões", "Conformidade LGPD"],
  },
];

export function SolutionsSection() {
  return (
    <section id="funcionalidades" className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wide">
            ✅ Funcionalidades
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            Tudo que você precisa no PRONTI
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas profissionais para organizar sua clínica e elevar sua prática
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {solutions.map((solution, index) => (
            <div
              key={index}
              className="group bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                <solution.icon className="h-7 w-7 text-white" />
              </div>
              
              <h3 className="font-display text-xl font-bold text-foreground mb-2">
                {solution.title}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {solution.description}
              </p>
              
              <ul className="space-y-2">
                {solution.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
