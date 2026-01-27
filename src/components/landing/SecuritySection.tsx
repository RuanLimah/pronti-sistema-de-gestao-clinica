import { Shield, Lock, Cloud, FileCheck, Heart } from "lucide-react";

const securityFeatures = [
  {
    icon: Lock,
    title: "Dados protegidos",
    description: "Criptografia de ponta a ponta em todas as informações sensíveis.",
  },
  {
    icon: Shield,
    title: "Prontuário seguro",
    description: "Acesso controlado e auditoria de todas as ações no sistema.",
  },
  {
    icon: Cloud,
    title: "Backup automático",
    description: "Seus dados estão seguros com backups diários em nuvem.",
  },
  {
    icon: FileCheck,
    title: "Conformidade LGPD",
    description: "Em total conformidade com a Lei Geral de Proteção de Dados.",
  },
  {
    icon: Heart,
    title: "Feito para saúde",
    description: "Desenvolvido especialmente para profissionais da saúde.",
  },
];

export function SecuritySection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-emerald-400 font-semibold text-sm uppercase tracking-wide">
            🔐 Segurança e Confiança
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mt-4 mb-4">
            Seus dados estão seguros conosco
          </h2>
          <p className="text-slate-400 text-lg">
            Privacidade e segurança são nossa prioridade número um
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
          {securityFeatures.map((feature, index) => (
            <div
              key={index}
              className="text-center group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-500/20 transition-colors">
                <feature.icon className="h-8 w-8 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center items-center gap-8 mt-16 pt-16 border-t border-slate-700">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="h-5 w-5 text-emerald-400" />
            <span className="text-sm">SSL Certificado</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="h-5 w-5 text-emerald-400" />
            <span className="text-sm">Dados Criptografados</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Cloud className="h-5 w-5 text-emerald-400" />
            <span className="text-sm">Hospedagem Segura</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <FileCheck className="h-5 w-5 text-emerald-400" />
            <span className="text-sm">LGPD Compliance</span>
          </div>
        </div>
      </div>
    </section>
  );
}
