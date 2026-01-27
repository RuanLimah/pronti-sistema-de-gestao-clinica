import { jsPDF } from 'jspdf';
import { Paciente, Prontuario } from '@/stores/dataStore';

interface ClinicalData {
  queixaPrincipal: string;
  historicoDoencaAtual: string;
  antecedentesPessoais: string;
  antecedentesFamiliares: string;
  alergias: string;
  medicamentosEmUso: string;
  observacoesGerais: string;
}

export function exportProntuarioPdf(
  paciente: Paciente, 
  prontuarios: Prontuario[],
  clinicalData: ClinicalData
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(23, 120, 108); // Primary color
  doc.text('PRONTI', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Sistema de Gestão para Psicólogos', 20, 27);
  doc.text(`Documento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 33);
  
  // Linha divisória
  doc.setDrawColor(23, 120, 108);
  doc.setLineWidth(0.5);
  doc.line(20, 38, 190, 38);
  
  // Dados do Paciente
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Dados do Paciente', 20, 50);
  
  doc.setFontSize(11);
  doc.text(`Nome: ${paciente.nome}`, 20, 60);
  doc.text(`Telefone: ${paciente.telefone}`, 20, 67);
  doc.text(`Email: ${paciente.email || 'Não informado'}`, 20, 74);
  doc.text(`Status: ${paciente.status === 'ativo' ? 'Ativo' : 'Inativo'}`, 120, 60);
  doc.text(`Cadastro: ${new Date(paciente.criadoEm).toLocaleDateString('pt-BR')}`, 120, 67);
  if (paciente.valorConsulta) {
    doc.text(`Valor Consulta: R$ ${paciente.valorConsulta.toFixed(2)}`, 120, 74);
  }
  
  let yPos = 90;
  
  // Dados Clínicos
  doc.setFontSize(14);
  doc.setTextColor(23, 120, 108);
  doc.text('Dados Clínicos', 20, yPos);
  yPos += 12;
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  
  const addSection = (label: string, content: string, isAlert = false) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setTextColor(100);
    doc.setFontSize(9);
    doc.text(label, 20, yPos);
    yPos += 5;
    
    doc.setTextColor(isAlert ? 180 : 0, isAlert ? 0 : 0, 0);
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(content || 'Não informado', 170);
    doc.text(lines, 20, yPos);
    yPos += (lines.length * 5) + 8;
  };
  
  addSection('Queixa Principal:', clinicalData.queixaPrincipal, true);
  addSection('Histórico da Doença Atual:', clinicalData.historicoDoencaAtual);
  addSection('Antecedentes Pessoais:', clinicalData.antecedentesPessoais);
  addSection('Antecedentes Familiares:', clinicalData.antecedentesFamiliares);
  addSection('Alergias:', clinicalData.alergias, true);
  addSection('Medicamentos em Uso:', clinicalData.medicamentosEmUso);
  addSection('Observações Gerais:', clinicalData.observacoesGerais);
  
  // Evoluções / Prontuários
  if (prontuarios.length > 0) {
    if (yPos > 220) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFontSize(14);
    doc.setTextColor(23, 120, 108);
    doc.text('Histórico de Evoluções', 20, yPos);
    yPos += 12;
    
    prontuarios.forEach((prontuario, index) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      // Data
      doc.setFontSize(9);
      doc.setTextColor(100);
      const dataFormatada = new Date(prontuario.criadoEm).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      doc.text(`${index + 1}. ${dataFormatada}`, 20, yPos);
      yPos += 5;
      
      // Texto
      doc.setTextColor(0);
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(prontuario.texto, 170);
      doc.text(lines, 20, yPos);
      yPos += (lines.length * 5) + 10;
    });
  }
  
  // Footer em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `PRONTI - Prontuário Digital | Página ${i} de ${pageCount}`,
      20,
      285
    );
    doc.text(
      'Documento confidencial - Uso exclusivo para fins clínicos',
      105,
      285,
      { align: 'center' }
    );
  }
  
  doc.save(`prontuario-${paciente.nome.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportFinancialPdf(
  payments: { pacienteNome: string; valor: number; data: Date; status: string; formaPagamento: string }[],
  period: string,
  totals: { recebido: number; pendente: number; total: number }
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(23, 120, 108);
  doc.text('PRONTI', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Relatório Financeiro', 20, 27);
  doc.text(`Período: ${period}`, 20, 34);
  
  // Summary
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Resumo', 20, 50);
  
  doc.setFontSize(12);
  doc.text(`Total Recebido: R$ ${totals.recebido.toFixed(2)}`, 20, 60);
  doc.text(`Total Pendente: R$ ${totals.pendente.toFixed(2)}`, 20, 67);
  doc.text(`Total Geral: R$ ${totals.total.toFixed(2)}`, 20, 74);
  
  // Table header
  let yPos = 90;
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 10, 'F');
  doc.text('Paciente', 22, yPos);
  doc.text('Data', 80, yPos);
  doc.text('Valor', 120, yPos);
  doc.text('Status', 155, yPos);
  
  yPos += 10;
  
  // Table rows
  payments.forEach((payment) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(payment.pacienteNome.substring(0, 25), 22, yPos);
    doc.text(new Date(payment.data).toLocaleDateString('pt-BR'), 80, yPos);
    doc.text(`R$ ${payment.valor.toFixed(2)}`, 120, yPos);
    doc.text(payment.status === 'pago' ? 'Pago' : 'Pendente', 155, yPos);
    yPos += 7;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Documento gerado em ${new Date().toLocaleDateString('pt-BR')} - Página ${i} de ${pageCount}`,
      20,
      285
    );
  }
  
  doc.save(`financeiro-${period.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportReportPdf(report: {
  periodo: string;
  totalAtendimentos: number;
  atendimentosRealizados: number;
  atendimentosCancelados: number;
  taxaFaltas: number;
  faturamento: number;
  recebido: number;
  pendente: number;
  pacientesAtivos: number;
}) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(23, 120, 108);
  doc.text('PRONTI', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Relatório de Desempenho', 20, 27);
  doc.text(`Período: ${report.periodo}`, 20, 34);
  
  // KPIs
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Indicadores', 20, 50);
  
  doc.setFontSize(12);
  doc.text(`Total de Atendimentos: ${report.totalAtendimentos}`, 20, 60);
  doc.text(`Atendimentos Realizados: ${report.atendimentosRealizados}`, 20, 67);
  doc.text(`Atendimentos Cancelados: ${report.atendimentosCancelados}`, 20, 74);
  doc.text(`Taxa de Faltas: ${report.taxaFaltas.toFixed(1)}%`, 20, 81);
  
  doc.text(`Faturamento: R$ ${report.faturamento.toFixed(2)}`, 120, 60);
  doc.text(`Recebido: R$ ${report.recebido.toFixed(2)}`, 120, 67);
  doc.text(`Pendente: R$ ${report.pendente.toFixed(2)}`, 120, 74);
  doc.text(`Pacientes Ativos: ${report.pacientesAtivos}`, 120, 81);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Documento gerado em ${new Date().toLocaleDateString('pt-BR')}`,
    20,
    285
  );
  
  doc.save(`relatorio-${report.periodo.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportWhatsAppReportPdf(
  messages: { paciente: string; tipo: string; status: string; data: Date }[]
) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(23, 120, 108);
  doc.text('PRONTI', 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Relatório de Mensagens WhatsApp', 20, 27);
  
  // Stats
  const total = messages.length;
  const enviados = messages.filter(m => m.status === 'enviado').length;
  const pendentes = messages.filter(m => m.status === 'pendente').length;
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Total de Mensagens: ${total}`, 20, 45);
  doc.text(`Enviadas: ${enviados}`, 20, 52);
  doc.text(`Pendentes: ${pendentes}`, 20, 59);
  
  // Table
  let yPos = 75;
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos - 5, 170, 10, 'F');
  doc.text('Paciente', 22, yPos);
  doc.text('Tipo', 80, yPos);
  doc.text('Data', 120, yPos);
  doc.text('Status', 160, yPos);
  
  yPos += 10;
  
  messages.forEach((msg) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(msg.paciente.substring(0, 25), 22, yPos);
    doc.text(msg.tipo, 80, yPos);
    doc.text(new Date(msg.data).toLocaleDateString('pt-BR'), 120, yPos);
    doc.text(msg.status, 160, yPos);
    yPos += 7;
  });
  
  doc.save('relatorio-whatsapp.pdf');
}
