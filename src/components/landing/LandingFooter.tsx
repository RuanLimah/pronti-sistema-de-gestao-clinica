import { Stethoscope } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="py-12 bg-slate-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">
              COZY<span className="text-emerald-400">PRACTIC</span>
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <a href="#funcionalidades" className="hover:text-white transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-white transition-colors">
              Planos
            </a>
            <a href="#depoimentos" className="hover:text-white transition-colors">
              Depoimentos
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Termos de Uso
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Privacidade
            </a>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 text-center">
          <p className="text-slate-500 text-sm">
            © 2024 Cozy Practic. Todos os direitos reservados.
          </p>
          <p className="text-slate-600 text-xs mt-2">
            Feito com ❤️ para profissionais da saúde
          </p>
        </div>
      </div>
    </footer>
  );
}
