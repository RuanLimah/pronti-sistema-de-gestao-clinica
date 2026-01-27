import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Mais de 500 profissionais já usam</span>
          </div>

          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Transforme a gestão do seu consultório hoje mesmo.
          </h2>

          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Junte-se a centenas de profissionais que já organizam suas rotinas com o Cozy Practic. 
            Comece grátis e veja a diferença.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate("/login")}
              className="bg-white text-emerald-600 hover:bg-white/90 text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold"
            >
              Teste grátis agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/login")}
              className="border-2 border-white text-white hover:bg-white/10 text-lg px-8 py-6 bg-transparent"
            >
              Login
            </Button>
          </div>

          <p className="text-white/70 text-sm mt-6">
            ✓ 7 dias grátis &nbsp; ✓ Sem cartão &nbsp; ✓ Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
}
