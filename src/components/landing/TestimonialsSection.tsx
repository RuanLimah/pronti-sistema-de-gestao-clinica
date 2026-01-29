import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Dra. Camila Rocha",
    role: "Psicóloga Clínica",
    // Female name → Female image (professional woman in healthcare)
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face",
    text: "O PRONTI transformou minha rotina. Antes eu perdia horas organizando prontuários, agora tenho tudo em um só lugar, com segurança e praticidade.",
    rating: 5,
  },
  {
    name: "Dr. Ricardo Almeida",
    role: "Médico - Clínica Geral",
    // Male name → Male image (professional male doctor)
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face",
    text: "A gestão financeira ficou muito mais clara. Consigo acompanhar recebimentos e inadimplências em tempo real. Recomendo para qualquer profissional de saúde.",
    rating: 5,
  },
  {
    name: "Dra. Fernanda Lima",
    role: "Dentista",
    // Female name → Female image (professional woman dentist)
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=150&h=150&fit=crop&crop=face",
    text: "A agenda inteligente e os relatórios me ajudam a ter uma visão completa do consultório. Interface limpa e fácil de usar.",
    rating: 5,
  },
  {
    name: "Dr. Fernando Santos",
    role: "Psiquiatra",
    // Male name → Male image (professional male psychiatrist)
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&h=150&fit=crop&crop=face",
    text: "O prontuário digital seguro e a auditoria de acessos me dão tranquilidade. Essencial para quem trabalha com saúde mental.",
    rating: 5,
  },
  {
    name: "Dra. Beatriz Costa",
    role: "Psicóloga Infantil",
    // Female name → Female image (professional woman psychologist)
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop&crop=face",
    text: "Sistema intuitivo e fácil de usar. Minha equipe se adaptou em poucos dias. Recomendo demais!",
    rating: 5,
  },
  {
    name: "Dr. Marcos Oliveira",
    role: "Nutricionista",
    // Male name → Male image (professional male nutritionist)
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&h=150&fit=crop&crop=face",
    text: "Os relatórios em PDF são profissionais e impressionam meus pacientes. Vale cada centavo investido.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="py-20 md:py-28 bg-gradient-to-b from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">
            ⭐ Depoimentos
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mt-4 mb-4">
            O que dizem nossos profissionais
          </h2>
          <p className="text-muted-foreground text-lg">
            Veja como o PRONTI está transformando clínicas e consultórios
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-border animate-fade-in relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/20" />
              
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/20"
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
