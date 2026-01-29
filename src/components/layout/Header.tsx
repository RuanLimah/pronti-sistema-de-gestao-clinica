import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search, Menu, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useDataStore } from "@/stores/dataStore";
import { useAuthStore } from "@/stores/authStore";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ title, subtitle, onMenuClick, showMenuButton }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    getPacientesByMedico, 
    getAtendimentosByMedico, 
    getNotificacoesNaoLidas,
    getConfiguracoesByMedico,
    fetchNotificacoes,
  } = useDataStore();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const medicoId = user?.id || "";
  const notificacoesNaoLidas = getNotificacoesNaoLidas(medicoId);
  const pacientes = getPacientesByMedico(medicoId);
  const atendimentos = getAtendimentosByMedico(medicoId);
  const config = getConfiguracoesByMedico(medicoId);

  useEffect(() => {
    if (medicoId) {
      fetchNotificacoes(medicoId);
    }
  }, [medicoId, fetchNotificacoes]);

  // Foto do usuário - priorizar config.avatarUrl, depois user.foto
  const avatarUrl = config?.avatarUrl || user?.foto;

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { pacientes: [], atendimentos: [] };

    const query = searchQuery.toLowerCase();
    
    const filteredPacientes = pacientes.filter(p => 
      p.nome.toLowerCase().includes(query) || 
      p.email?.toLowerCase().includes(query) ||
      p.telefone.includes(query)
    ).slice(0, 5);

    const filteredAtendimentos = atendimentos.filter(a => {
      const paciente = pacientes.find(p => p.id === a.pacienteId);
      return paciente?.nome.toLowerCase().includes(query);
    }).slice(0, 5);

    return { pacientes: filteredPacientes, atendimentos: filteredAtendimentos };
  }, [searchQuery, pacientes, atendimentos]);

  const handleNotificacoesClick = () => {
    navigate("/notificacoes");
  };

  const handlePacienteClick = (pacienteId: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/pacientes/${pacienteId}/prontuario`);
  };

  const handleAtendimentoClick = () => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate("/agenda");
  };

  const getUserInitials = () => {
    if (!user?.nome) return "U";
    return user.nome.split(" ").map(n => n[0]).join("").slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {showMenuButton && (
          <Button variant="ghost" size="icon" onClick={onMenuClick} className="shrink-0">
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary hidden md:block" />
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-semibold text-foreground font-display truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs md:text-sm text-muted-foreground truncate hidden sm:block">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Search */}
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0" align="end">
            <Command>
              <CommandInput 
                placeholder="Buscar pacientes, atendimentos..." 
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList>
                <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                {searchResults.pacientes.length > 0 && (
                  <CommandGroup heading="Pacientes">
                    {searchResults.pacientes.map((paciente) => (
                      <CommandItem 
                        key={paciente.id}
                        onSelect={() => handlePacienteClick(paciente.id)}
                        className="cursor-pointer"
                      >
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarFallback className="text-xs">
                            {paciente.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{paciente.nome}</span>
                        <Badge variant={paciente.status === 'ativo' ? 'success' : 'secondary'} className="ml-auto text-xs">
                          {paciente.status}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {searchResults.atendimentos.length > 0 && (
                  <CommandGroup heading="Atendimentos">
                    {searchResults.atendimentos.map((atendimento) => {
                      const paciente = pacientes.find(p => p.id === atendimento.pacienteId);
                      return (
                        <CommandItem 
                          key={atendimento.id}
                          onSelect={handleAtendimentoClick}
                          className="cursor-pointer"
                        >
                          <span>{paciente?.nome} - {atendimento.hora}</span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Desktop Search */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar pacientes, atendimentos..."
                className="w-64 pl-9 bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
              />
            </div>
          </PopoverTrigger>
          {searchQuery && (
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandList>
                  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                  {searchResults.pacientes.length > 0 && (
                    <CommandGroup heading="Pacientes">
                      {searchResults.pacientes.map((paciente) => (
                        <CommandItem 
                          key={paciente.id}
                          onSelect={() => handlePacienteClick(paciente.id)}
                          className="cursor-pointer"
                        >
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarFallback className="text-xs">
                              {paciente.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{paciente.nome}</span>
                          <Badge variant={paciente.status === 'ativo' ? 'success' : 'secondary'} className="ml-auto text-xs">
                            {paciente.status}
                          </Badge>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {searchResults.atendimentos.length > 0 && (
                    <CommandGroup heading="Atendimentos">
                      {searchResults.atendimentos.map((atendimento) => {
                        const paciente = pacientes.find(p => p.id === atendimento.pacienteId);
                        return (
                          <CommandItem 
                            key={atendimento.id}
                            onSelect={handleAtendimentoClick}
                            className="cursor-pointer"
                          >
                            <span>{paciente?.nome} - {atendimento.hora}</span>
                            <span className="ml-auto text-xs text-muted-foreground">
                              {new Date(atendimento.data).toLocaleDateString('pt-BR')}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          )}
        </Popover>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative h-9 w-9"
          onClick={handleNotificacoesClick}
        >
          <Bell className="h-5 w-5" />
          {notificacoesNaoLidas.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {notificacoesNaoLidas.length > 9 ? '9+' : notificacoesNaoLidas.length}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <div className="flex items-center gap-2 md:gap-3">
          <Avatar className="h-8 w-8 md:h-9 md:w-9 border-2 border-primary/20">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">{user?.nome || "Usuário"}</p>
            <p className="text-xs text-muted-foreground">
              {user?.tipo === 'admin' ? 'Administrador' : (user as any)?.crp || 'Psicólogo'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
