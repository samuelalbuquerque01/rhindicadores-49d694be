import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserMinus, Clock, Palmtree, XCircle, Calendar } from "lucide-react";
import { useColaboradores } from "@/hooks/useColaboradores";
import { useDesligamentos } from "@/hooks/useDesligamentos";
import { useAfastamentos } from "@/hooks/useAfastamentos";
import { useFiliais } from "@/hooks/useFiliais";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ColaboradoresStatusListProps {
  filialId?: string;
}

export function ColaboradoresStatusList({ filialId }: ColaboradoresStatusListProps) {
  const [activeTab, setActiveTab] = useState("afastados");
  
  const { data: afastados } = useColaboradores({
    filialId: filialId === "all" ? undefined : filialId,
    status: "Afastado",
  });
  
  const { data: ferias } = useColaboradores({
    filialId: filialId === "all" ? undefined : filialId,
    status: "Férias",
  });
  
  const { data: inativos } = useColaboradores({
    filialId: filialId === "all" ? undefined : filialId,
    status: "Inativo",
  });

  const { data: desligamentos } = useDesligamentos(filialId === "all" ? undefined : filialId);
  const { data: afastamentosRecords } = useAfastamentos(filialId === "all" ? undefined : filialId);
  const { data: filiais } = useFiliais();

  const getFilialNome = (filialId?: string) => {
    if (!filialId) return "-";
    return filiais?.find(f => f.id === filialId)?.nome || "-";
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserMinus className="h-5 w-5" />
          Status dos Colaboradores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="afastados" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Afastados ({afastados?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="ferias" className="flex items-center gap-1">
              <Palmtree className="h-4 w-4" />
              Férias ({ferias?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="inativos" className="flex items-center gap-1">
              <XCircle className="h-4 w-4" />
              Inativos ({inativos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="desligados" className="flex items-center gap-1">
              <UserMinus className="h-4 w-4" />
              Desligados ({desligamentos?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="afastados" className="mt-4">
            {!afastados?.length ? (
              <p className="text-center text-muted-foreground py-8">Nenhum colaborador afastado</p>
            ) : (
              <div className="space-y-3">
                {afastados.map((colaborador) => {
                  const afastamento = afastamentosRecords?.find(a => a.colaborador_id === colaborador.id);
                  return (
                    <div key={colaborador.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{colaborador.nome}</p>
                        <p className="text-sm text-muted-foreground">{colaborador.cargo} • {colaborador.departamento}</p>
                        <p className="text-xs text-muted-foreground">{getFilialNome(colaborador.filial_id)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">Afastado</Badge>
                        {afastamento && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {afastamento.tipo} • {formatDate(afastamento.data_inicio)} - {formatDate(afastamento.data_fim)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ferias" className="mt-4">
            {!ferias?.length ? (
              <p className="text-center text-muted-foreground py-8">Nenhum colaborador em férias</p>
            ) : (
              <div className="space-y-3">
                {ferias.map((colaborador) => {
                  const afastamento = afastamentosRecords?.find(a => a.colaborador_id === colaborador.id && a.tipo === "Férias");
                  return (
                    <div key={colaborador.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{colaborador.nome}</p>
                        <p className="text-sm text-muted-foreground">{colaborador.cargo} • {colaborador.departamento}</p>
                        <p className="text-xs text-muted-foreground">{getFilialNome(colaborador.filial_id)}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Palmtree className="h-3 w-3 mr-1" />
                          Férias
                        </Badge>
                        {afastamento && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(afastamento.data_inicio)} - {formatDate(afastamento.data_fim)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inativos" className="mt-4">
            {!inativos?.length ? (
              <p className="text-center text-muted-foreground py-8">Nenhum colaborador inativo</p>
            ) : (
              <div className="space-y-3">
                {inativos.map((colaborador) => (
                  <div key={colaborador.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{colaborador.nome}</p>
                      <p className="text-sm text-muted-foreground">{colaborador.cargo} • {colaborador.departamento}</p>
                      <p className="text-xs text-muted-foreground">{getFilialNome(colaborador.filial_id)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">Inativo</Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {colaborador.tipo_colaborador}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="desligados" className="mt-4">
            {!desligamentos?.length ? (
              <p className="text-center text-muted-foreground py-8">Nenhum desligamento registrado</p>
            ) : (
              <div className="space-y-3">
                {desligamentos.map((desligamento) => (
                  <div key={desligamento.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{desligamento.colaborador?.nome || "Colaborador"}</p>
                      <p className="text-sm text-muted-foreground">
                        {desligamento.colaborador?.cargo} • {desligamento.colaborador?.departamento}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getFilialNome(desligamento.colaborador?.filial_id)}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive" className="mb-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(desligamento.data_desligamento)}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{desligamento.motivo}</p>
                      {desligamento.custo_rescisao && desligamento.custo_rescisao > 0 && (
                        <p className="text-xs font-medium text-destructive">
                          R$ {desligamento.custo_rescisao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
