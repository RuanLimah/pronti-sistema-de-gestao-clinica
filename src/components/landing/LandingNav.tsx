import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Menu, X, Stethoscope } from "lucide-react";
import { useState } from "react";

export function LandingNav() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold text-foreground">
            COZY<span className="text-emerald-600">PRACTIC</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <a href="#funcionalidades" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Funcionalidades
          </a>
          <a href="#planos" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Planos
          </a>
          <a href="#depoimentos" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
            Depoimentos
          </a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/login")}
            className="font-medium"
          >
            Login
          </Button>
          <Button 
            onClick={() => navigate("/login")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
          >
            Teste grátis
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            <a 
              href="#funcionalidades" 
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Funcionalidades
            </a>
            <a 
              href="#planos" 
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Planos
            </a>
            <a 
              href="#depoimentos" 
              className="text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Depoimentos
            </a>
            <div className="flex flex-col gap-2 pt-2 border-t border-border">
              <Button variant="outline" onClick={() => navigate("/login")} className="w-full">
                Login
              </Button>
              <Button 
                onClick={() => navigate("/login")}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                Teste grátis
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
