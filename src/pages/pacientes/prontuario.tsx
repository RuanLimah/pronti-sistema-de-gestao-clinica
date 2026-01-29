import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  ArrowLeft, 
  User, 
  FileText, 
  Save, 
  Download,
  Edit,
  Phone,
  Mail,
  Clock,
  Stethoscope,
  Pill,
  AlertTriangle,
  History,
  Upload,
  FlaskConical,
} from "lucide-react";
import { useDataStore, Prontuario, ExameMedico } from "@/stores/dataStore";
import { toast } from "@/hooks/use-toast";
import { exportProntuarioPdf } from "@/lib/pdfExport";
import { EvolucoesList } from "@/components/prontuario/EvolucoesList";
import { ExamesList } from "@/components/prontuario/ExamesList";
import { ExameUploadModal } from "@/components/prontuario/ExameUploadModal";
import { useAuthStore } from "@/stores/authStore";

export default function ProntuarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const { 
    getPacienteById, 
    updatePaciente, 
    getProntuariosByPaciente, 
    addProntuario,
    updateProntuario,
    deleteProntuario,
    getAtendimentosByPaciente,
    getExamesByPaciente,
    addExame,
    deleteExame,
    fetchProntuarios,
    fetchExames,
    fetchAtendimentos,
    fetchPacientes
  } = useDataStore();

  useEffect(() => {
    if (user?.id && id) {
      // Ensure patient data is loaded
      fetchPacientes(user.id);
      fetchProntuarios(id);
      fetchExames(id);
      fetchAtendimentos(user.id);
    }
  }, [user?.id, id, fetchProntuarios, fetchExames, fetchAtendimentos, fetchPacientes]);

  const paciente = getPacienteById(id || "");
  
  // Prontuários ordenados
  const prontuarios = useMemo(() => 
    getProntuariosByPaciente(id || "").sort((a, b) => 
      new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    ), [id, getProntuariosByPaciente]
  );

  // Exames ordenados
  const exames = useMemo(() => 
    getExamesByPaciente(id || "").sort((a, b) => 
      new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    ), [id, getExamesByPaciente]
  );

  // Atendimentos realizados
  const atendimentos = useMemo(() => 
    getAtendimentosByPaciente(id || "").filter(a => a.status === 'realizado')
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
  , [id, getAtendimentosByPaciente]);

  // Estado para edição dos dados clínicos
  const [isEditing, setIsEditing] = useState(false);
  const [clinicalData, setClinicalData] = useState({
    queixaPrincipal: paciente?.queixaPrincipal || "",
    historicoDoencaAtual: paciente?.historicoDoencaAtual || "",
    antecedentesPessoais: paciente?.antecedentesPessoais || "",
    antecedentesFamiliares: paciente?.antecedentesFamiliares || "",
    alergias: paciente?.alergias || "",
    medicamentosEmUso: paciente?.medicamentosEmUso || "",
    observacoesGerais: paciente?.observacoesGerais || "",
  });

  // Modal de upload de exame
  const [uploadExameOpen, setUploadExameOpen] = useState(false);

  // Tab ativa
  const [activeTab, setActiveTab] = useState("evolucoes");

  if (!paciente) {
    return (
      <DashboardLayout title="Prontuário" subtitle="Paciente não encontrado">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">Paciente não encontrado.</p>
          <Button onClick={() => navigate("/pacientes")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Pacientes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSaveClinicalData = () => {
    updatePaciente(paciente.id, clinicalData);
    setIsEditing(false);
    toast({
      title: "Dados salvos",
      description: "As informações clínicas foram atualizadas.",
    });
  };

  const handleAddEvolucao = (texto: string) => {
    addProntuario({
      pacienteId: paciente.id,
      texto,
    });
  };

  const handleEditEvolucao = (id: string, texto: string) => {
    updateProntuario(id, { texto });
  };

  const handleDeleteEvolucao = (id: string) => {
    deleteProntuario(id);
  };

  const handleUploadExame = (exameData: Omit<ExameMedico, 'id' | 'criadoEm'>) => {
    addExame(exameData);
  };

  const handleDeleteExame = (id: string) => {
    deleteExame(id);
    toast({
      title: "Exame excluído",
      description: "O arquivo foi removido do prontuário.",
    });
  };

  const handleExportPdf = () => {
    exportProntuarioPdf(paciente, prontuarios, clinicalData);
    toast({
      title: "PDF gerado",
      description: "O prontuário foi exportado com sucesso.",
    });
  };

  return (
    <DashboardLayout
      title="Prontuário Digital"
      subtitle={`Informações clínicas de ${paciente.nome}`}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Header com ações */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => navigate("/pacientes")}
          >
            <ArrowLeft size={18} />
            Voltar para pacientes
          </Button>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleExportPdf}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => setUploadExameOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Exame
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Coluna Principal - Dados Clínicos */}
          <div className="xl:col-span-2 space-y-6">
            {/* Card do Paciente */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{paciente.nome}</CardTitle>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {paciente.telefone}
                      </span>
                      {paciente.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {paciente.email}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant={paciente.status === 'ativo' ? 'default' : 'secondary'}>
                  {paciente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Cadastro</p>
                    <p className="font-medium">
                      {new Date(paciente.criadoEm).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Atendimentos</p>
                    <p className="font-medium">{atendimentos.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Evoluções</p>
                    <p className="font-medium">{prontuarios.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Valor Consulta</p>
                    <p className="font-medium">
                      {paciente.valorConsulta 
                        ? `R$ ${paciente.valorConsulta.toFixed(2)}` 
                        : 'Não definido'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados Clínicos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Dados Clínicos
                </CardTitle>
                {!isEditing ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button variant="hero" size="sm" onClick={handleSaveClinicalData}>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Queixa Principal
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={clinicalData.queixaPrincipal}
                        onChange={(e) => setClinicalData({ ...clinicalData, queixaPrincipal: e.target.value })}
                        placeholder="Descreva a queixa principal do paciente..."
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm bg-muted/50 rounded-lg p-3">
                        {clinicalData.queixaPrincipal || "Não informado"}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Histórico da Doença Atual</Label>
                    {isEditing ? (
                      <Textarea
                        value={clinicalData.historicoDoencaAtual}
                        onChange={(e) => setClinicalData({ ...clinicalData, historicoDoencaAtual: e.target.value })}
                        placeholder="Descreva o histórico da doença atual..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm bg-muted/50 rounded-lg p-3">
                        {clinicalData.historicoDoencaAtual || "Não informado"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Antecedentes Pessoais</Label>
                      {isEditing ? (
                        <Textarea
                          value={clinicalData.antecedentesPessoais}
                          onChange={(e) => setClinicalData({ ...clinicalData, antecedentesPessoais: e.target.value })}
                          placeholder="Histórico pessoal de saúde..."
                          className="min-h-[80px]"
                        />
                      ) : (
                        <p className="text-sm bg-muted/50 rounded-lg p-3 min-h-[60px]">
                          {clinicalData.antecedentesPessoais || "Não informado"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Antecedentes Familiares</Label>
                      {isEditing ? (
                        <Textarea
                          value={clinicalData.antecedentesFamiliares}
                          onChange={(e) => setClinicalData({ ...clinicalData, antecedentesFamiliares: e.target.value })}
                          placeholder="Histórico familiar de saúde..."
                          className="min-h-[80px]"
                        />
                      ) : (
                        <p className="text-sm bg-muted/50 rounded-lg p-3 min-h-[60px]">
                          {clinicalData.antecedentesFamiliares || "Não informado"}
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        Alergias
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={clinicalData.alergias}
                          onChange={(e) => setClinicalData({ ...clinicalData, alergias: e.target.value })}
                          placeholder="Liste as alergias conhecidas..."
                          className="min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                          {clinicalData.alergias || "Nenhuma alergia registrada"}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Pill className="h-4 w-4 text-primary" />
                        Medicamentos em Uso
                      </Label>
                      {isEditing ? (
                        <Textarea
                          value={clinicalData.medicamentosEmUso}
                          onChange={(e) => setClinicalData({ ...clinicalData, medicamentosEmUso: e.target.value })}
                          placeholder="Liste os medicamentos em uso..."
                          className="min-h-[60px]"
                        />
                      ) : (
                        <p className="text-sm bg-muted/50 rounded-lg p-3">
                          {clinicalData.medicamentosEmUso || "Nenhum medicamento registrado"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações Gerais</Label>
                    {isEditing ? (
                      <Textarea
                        value={clinicalData.observacoesGerais}
                        onChange={(e) => setClinicalData({ ...clinicalData, observacoesGerais: e.target.value })}
                        placeholder="Observações adicionais..."
                        className="min-h-[80px]"
                      />
                    ) : (
                      <p className="text-sm bg-muted/50 rounded-lg p-3">
                        {clinicalData.observacoesGerais || "Sem observações"}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Lateral - Evoluções, Exames e Histórico */}
          <div className="space-y-6">
            {/* Tabs para Evoluções e Exames */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="evolucoes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Evoluções</span>
                  {prontuarios.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {prontuarios.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="exames" className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" />
                  <span className="hidden sm:inline">Exames</span>
                  {exames.length > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {exames.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="evolucoes" className="mt-4">
                <EvolucoesList
                  prontuarios={prontuarios}
                  pacienteNome={paciente.nome}
                  onAdd={handleAddEvolucao}
                  onEdit={handleEditEvolucao}
                  onDelete={handleDeleteEvolucao}
                />
              </TabsContent>

              <TabsContent value="exames" className="mt-4">
                <ExamesList
                  exames={exames}
                  onAddClick={() => setUploadExameOpen(true)}
                  onDelete={handleDeleteExame}
                />
              </TabsContent>
            </Tabs>

            {/* Histórico de Atendimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Histórico de Atendimentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {atendimentos.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum atendimento realizado.
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {atendimentos.slice(0, 10).map((atendimento) => (
                      <AccordionItem key={atendimento.id} value={atendimento.id}>
                        <AccordionTrigger className="text-sm hover:no-underline">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            {new Date(atendimento.data).toLocaleDateString('pt-BR')} - {atendimento.hora}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Valor:</span>
                              <span>R$ {(atendimento.valor || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge variant="success">Realizado</Badge>
                            </div>
                            {atendimento.observacoes && (
                              <div>
                                <span className="text-muted-foreground">Observações:</span>
                                <p className="mt-1">{atendimento.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Upload de Exame */}
      <ExameUploadModal
        open={uploadExameOpen}
        onOpenChange={setUploadExameOpen}
        pacienteId={paciente.id}
        onUpload={handleUploadExame}
      />
    </DashboardLayout>
  );
}
