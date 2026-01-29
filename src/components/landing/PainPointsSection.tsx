import { 
  FolderX, 
  FileQuestion, 
  Calculator, 
  History, 
  FileX2, 
  ShieldAlert 
} from "lucide-react";

const painPoints = [
  {
    icon: FolderX,
    title: "Falta de organização",
    description: "Consultas perdidas, horários confusos e agenda descontrolada prejudicam sua rotina.",
  },
  {
    icon: FileQuestion,
    title: "Prontuários inseguros",
    description: "Informações em papéis, planilhas ou sistemas sem proteção adequada.",
  },
  {
    icon: History,
    title: "Perda de histórico",
    description: "Dificuldade em acessar atendimentos anteriores e evolução dos pacientes.",
  },
  {
    icon: Calculator,
    title: "Controle financeiro manual",
    description: "Sem controle de recebimentos, pagamentos e inadimplências em tempo real.",
  },
  {
    icon: FileX2,
    title: "Falta de relatórios claros",
    description: "Impossível ter visão do negócio e tomar decisões sem dados organizados.",
  },
  {
    icon: ShieldAlert,
    title: "Sem rastreabilidade",
    description: "Falta de auditoria e segurança nos acessos aos dados dos pacientes.",
  },
];

export function PainPointsSection() {
  return (
    <section id="dores" className="py-20 md:py-28 bg-gradient-to-b from-secondary to-secondary/50 dark:from-secondary/30 dark:to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-destructive font-semibold text-sm uppercase tracking-wide">
            😖 As dores do dia a dia
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            Você enfrenta esses problemas?
          </h2>
          <p className="text-muted-foreground text-lg">
            A rotina de uma clínica pode ser caótica sem as ferramentas certas
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {painPoints.map((pain, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl p-6 border border-destructive/20 hover:border-destructive/40 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0 group-hover:bg-destructive/15 transition-colors">
                  <pain.icon className="h-6 w-6 text-destructive" />
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
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-6 py-3 rounded-full font-medium">
            ✨ O PRONTI resolve todos esses problemas
          </div>
        </div>
      </div>
    </section>
  );
}
