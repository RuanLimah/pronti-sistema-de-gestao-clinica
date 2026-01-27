import { 
  FolderX, 
  FileQuestion, 
  Calculator, 
  BellOff, 
  FileX2, 
  Clock 
} from "lucide-react";

const painPoints = [
  {
    icon: FolderX,
    title: "Falta de organização",
    description: "Consultas perdidas, horários confusos e agenda descontrolada.",
  },
  {
    icon: FileQuestion,
    title: "Prontuários espalhados",
    description: "Informações em papéis, planilhas e lugares diferentes.",
  },
  {
    icon: Calculator,
    title: "Financeiro confuso",
    description: "Sem controle de recebimentos, pagamentos e inadimplências.",
  },
  {
    icon: BellOff,
    title: "Esquecimento de consultas",
    description: "Pacientes faltando por não receber lembretes adequados.",
  },
  {
    icon: FileX2,
    title: "Falta de relatórios claros",
    description: "Impossível ter visão do negócio sem dados organizados.",
  },
  {
    icon: Clock,
    title: "Perda de tempo",
    description: "Tarefas manuais repetitivas que poderiam ser automatizadas.",
  },
];

export function PainPointsSection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-100 to-slate-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-rose-500 font-semibold text-sm uppercase tracking-wide">
            😖 As dores do dia a dia
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            Você enfrenta esses problemas?
          </h2>
          <p className="text-muted-foreground text-lg">
            A rotina de um consultório pode ser caótica sem as ferramentas certas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {painPoints.map((pain, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 border border-rose-100 hover:border-rose-200 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                  <pain.icon className="h-6 w-6 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {pain.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {pain.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full font-medium">
            ✨ O Cozy Practic resolve todos esses problemas
          </div>
        </div>
      </div>
    </section>
  );
}
