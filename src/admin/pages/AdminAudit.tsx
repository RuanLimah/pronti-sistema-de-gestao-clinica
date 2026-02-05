import { useEffect, useState } from "react";
import { adminService } from "../services/adminService";
import { AdminAuditLog } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export function AdminAudit() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      const data = await adminService.getAuditLogs(100); // Fetch more for the dedicated page
      setLogs(data);
    } catch (error) {
      toast.error("Erro ao carregar auditoria");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Auditoria do Sistema</h2>
          <p className="text-muted-foreground">Registro de ações administrativas e mudanças críticas.</p>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Entidade</TableHead>
              <TableHead>ID Entidade</TableHead>
              <TableHead>Detalhes</TableHead>
              <TableHead>Autor (ID)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.acao}</Badge>
                  </TableCell>
                  <TableCell>{log.entidade}</TableCell>
                  <TableCell className="font-mono text-xs">{log.entidade_id}</TableCell>
                  <TableCell>
                    <pre className="text-[10px] bg-muted p-2 rounded max-w-[300px] overflow-x-auto">
                      {JSON.stringify(log.detalhes, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {log.actor_id}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
