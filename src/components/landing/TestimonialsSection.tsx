import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dra. Ana Paula",
    role: "Psicóloga Clínica",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
    text: "Depois que comecei a usar o Cozy Practic, meu consultório ficou muito mais organizado. Economizo tempo e tenho tudo em um só lugar.",
    rating: 5,
  },
  {
    name: "Dr. Ricardo Mendes",
    role: "Psiquiatra",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    text: "Os lembretes automáticos reduziram as faltas em 70%. O controle financeiro me deu uma visão clara do negócio.",
    rating: 5,
  },
  {
    name: "Dra. Camila Santos",
    role: "Dentista",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    text: "Finalmente consigo ver todo o histórico do paciente em um clique. A organização do prontuário é impecável.",
    rating: 5,
  },
  {
    name: "Dr. Fernando Lima",
    role: "Clínico Geral",
    image: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&h=150&fit=crop&crop=face",
    text: "A integração com WhatsApp mudou minha comunicação com pacientes. Profissional e eficiente.",
    rating: 5,
  },
  {
    name: "Dra. Beatriz Costa",
    role: "Psicóloga Infantil",
    image: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=150&h=150&fit=crop&crop=face",
    text: "Sistema intuitivo e fácil de usar. Minha equipe se adaptou em poucos dias. Recomendo demais!",
    rating: 5,
  },
  {
    name: "Dr. Marcos Oliveira",
    role: "Nutricionista",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    text: "Os relatórios em PDF são profissionais e impressionam meus pacientes. Vale cada centavo investido.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-gradient-to-b from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-emerald-600 font-semibold text-sm uppercase tracking-wide">
            💬 Prova Social
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            Quem usa, recomenda
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja o que profissionais da saúde dizem sobre o Cozy Practic
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-slate-100 animate-fade-in relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-emerald-100" />
              
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-emerald-100"
                />
                <div>
                  <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-muted-foreground italic leading-relaxed">
                "{testimonial.text}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
