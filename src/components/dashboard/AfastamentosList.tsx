import { useState } from "react";
import { 
  Clock, 
  Stethoscope, 
  Palmtree, 
  Baby, 
  HelpCircle,
  Users
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAfastamentosPorTipo } from "@/hooks/useAfastamentoAtivo";
import { useFiliais } from "@/hooks/useFiliais";
import { AfastamentoForm } from "@/components/forms/AfastamentoForm";
import { AfastamentoBadge } from "./AfastamentoBadge";

interface AfastamentosListProps {
  filialId?: string;
}

const TIPOS_AFASTAMENTO = [
  { value: "todos", label: "Todos", icon: Users },
  { value: "Atestado médico", label: "Atestado", icon: Stethoscope },
  { value: "Banco de horas", label: "Banco de horas", icon: Clock },
  { value: "Férias", label: "Férias", icon: Palmtree },
  { value: "Licença maternidade", label: "Lic. Maternidade", icon: Baby },
  { value: "Licença paternidade", label: "Lic. Paternidade", icon: Baby },
  { value: "Outro", label: "Outros", icon: HelpCircle },
];

export function AfastamentosList({ filialId }: AfastamentosListProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState("todos");
  const { data: afastamentos, isLoading } = useAfastamentosPorTipo(
    tipoSelecionado,
    filialId === "all" ? undefined : filialId
  );
  const { data: filiais } = useFiliais();

  const getFilialNome = (filialId?: string) => {
    if (!filialId) return "-";
    return filiais?.find((f) => f.id === filialId)?.nome || "-";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("pt-BR");
  };

  const getContagem = (tipo: string) => {
    if (!afastamentos) return 0;
    if (tipo === "todos") return afastamentos.length;
    return afastamentos.filter((a) => a.tipo === tipo).length;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Afastamentos Ativos
          </CardTitle>
          <AfastamentoForm />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={tipoSelecionado} onValueChange={setTipoSelecionado}>
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {TIPOS_AFASTAMENTO.map((tipo) => {
              const Icon = tipo.icon;
              const count = tipo.value === tipoSelecionado ? undefined : getContagem(tipo.value);
              return (
                <TabsTrigger 
                  key={tipo.value} 
                  value={tipo.value}
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{tipo.label}</span>
                  <span className="sm:hidden">{tipo.label.split(" ")[0]}</span>
                  {count !== undefined && count > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={tipoSelecionado} className="mt-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando...
              </div>
            ) : !afastamentos?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum afastamento ativo{" "}
                {tipoSelecionado !== "todos" && `do tipo "${tipoSelecionado}"`}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Período</TableHead>
                      <TableHead>Dias</TableHead>
                      <TableHead>Filial</TableHead>
                      <TableHead>Observações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {afastamentos.map((afastamento: any) => (
                      <TableRow key={afastamento.id}>
                        <TableCell className="font-medium">
                          {afastamento.colaborador?.nome || "-"}
                        </TableCell>
                        <TableCell>
                          <AfastamentoBadge 
                            afastamento={{
                              id: afastamento.id,
                              colaborador_id: afastamento.colaborador_id,
                              tipo: afastamento.tipo,
                              data_inicio: afastamento.data_inicio,
                              data_fim: afastamento.data_fim,
                              dias_afastados: afastamento.dias_afastados || 0,
                              observacoes: afastamento.observacoes,
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          {formatDate(afastamento.data_inicio)} -{" "}
                          {formatDate(afastamento.data_fim)}
                        </TableCell>
                        <TableCell>
                          {afastamento.dias_afastados || "-"}
                        </TableCell>
                        <TableCell>
                          {getFilialNome(afastamento.colaborador?.filial_id)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {afastamento.observacoes || "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
