import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Calendar, FileText, DollarSign, BarChart3, Brain } from "lucide-react";

export function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {/* Background Elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-emerald-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-teal-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-50 to-transparent rounded-full opacity-50" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge className="mb-6 px-4 py-2 text-sm bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100">
            ✨ Sistema completo para clínicas e consultórios
          </Badge>

          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Organize sua clínica com{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              produtividade, segurança e simplicidade.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            O PRONTI reúne agenda, prontuário digital, financeiro e relatórios em uma plataforma{" "}
            <span className="font-semibold text-foreground">segura, intuitiva e profissional.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/login?mode=signup")}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg px-8 py-6 shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Cadastre-se grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/login")}
              className="text-lg px-8 py-6 border-2 hover:bg-slate-50"
            >
              Login
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            ✓ Teste grátis &nbsp; ✓ Sem cartão de crédito &nbsp; ✓ Cancele quando quiser
          </p>
        </div>

        {/* Mockup Preview */}
        <div className="mt-16 max-w-5xl mx-auto relative">
          <div className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
            {/* Browser Bar */}
            <div className="h-10 bg-slate-800 flex items-center px-4 gap-2 border-b border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="flex-1 mx-4">
                <div className="bg-slate-700 rounded-md h-6 max-w-xs mx-auto flex items-center justify-center">
                  <span className="text-xs text-slate-400">pronti.app/dashboard</span>
                </div>
              </div>
            </div>
            
            {/* App Preview Content */}
            <div className="p-4 md:p-6 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Calendar, label: "Agenda", color: "bg-emerald-500" },
                  { icon: FileText, label: "Prontuário", color: "bg-teal-500" },
                  { icon: DollarSign, label: "Financeiro", color: "bg-blue-500" },
                  { icon: BarChart3, label: "Relatórios", color: "bg-purple-500" },
                ].map((item, i) => (
                  <div 
                    key={i} 
                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md transition-shadow"
                  >
                    <div className={`${item.color} p-3 rounded-lg text-white`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Floating elements */}
          <div className="hidden md:block absolute -left-8 top-1/3 bg-white rounded-xl shadow-xl p-4 border border-slate-100 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Próxima consulta</p>
                <p className="text-sm font-semibold">14:00 - Maria Silva</p>
              </div>
            </div>
          </div>

          <div className="hidden md:block absolute -right-8 top-1/2 bg-white rounded-xl shadow-xl p-4 border border-slate-100 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <Brain className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prontuário seguro</p>
                <p className="text-sm font-semibold text-teal-600">✓ Dados protegidos</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
