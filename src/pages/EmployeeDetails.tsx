import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Building, 
  Briefcase,
  Star,
  TrendingUp,
  Award,
  FileText,
  Clock,
  User,
  GraduationCap,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AfastamentoBadge } from "@/components/dashboard/AfastamentoBadge";

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const calculateTenure = (hireDate: string) => {
  const hire = new Date(hireDate);
  const now = new Date();
  const years = now.getFullYear() - hire.getFullYear();
  const months = now.getMonth() - hire.getMonth();
  
  if (months < 0) {
    return `${years - 1} anos e ${12 + months} meses`;
  }
  if (years === 0) {
    return `${months} meses`;
  }
  return `${years} anos e ${months} meses`;
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case "Ativo": return "bg-success/10 text-success border-success/20";
    case "Inativo": return "bg-destructive/10 text-destructive border-destructive/20";
    case "Afastado": return "bg-warning/10 text-warning border-warning/20";
    case "Férias": return "bg-info/10 text-info border-info/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const getAfastamentoStatus = (dataInicio: string, dataFim: string) => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(dataInicio + "T00:00:00");
  const fim = new Date(dataFim + "T00:00:00");
  if (hoje < inicio) return "Futuro";
  if (hoje > fim) return "Encerrado";
  return "Ativo";
};

const getAfastamentoStatusClass = (status: string) => {
  switch (status) {
    case "Ativo": return "bg-warning/10 text-warning border-warning/20";
    case "Encerrado": return "bg-muted text-muted-foreground";
    case "Futuro": return "bg-info/10 text-info border-info/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: colaborador, isLoading } = useQuery({
    queryKey: ["colaborador-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("colaboradores")
        .select("*, filial:filiais(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: afastamentos } = useQuery({
    queryKey: ["afastamentos-colaborador", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afastamentos")
        .select("*")
        .eq("colaborador_id", id!)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: contratacao } = useQuery({
    queryKey: ["contratacao-colaborador", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contratacoes")
        .select("*")
        .eq("colaborador_id", id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: treinamentos } = useQuery({
    queryKey: ["treinamentos-colaborador", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treinamento_participacoes")
        .select("*, treinamento:treinamentos(*)")
        .eq("colaborador_id", id!);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: liderFormado } = useQuery({
    queryKey: ["lider-formado-colaborador", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lideres_formados")
        .select("*")
        .eq("colaborador_id", id!)
        .order("data_formacao", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Colaborador não encontrado.</p>
        <Button variant="outline" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  const filial = colaborador.filial as any;
  const isNovaContratacao = () => {
    const admissao = new Date(colaborador.data_admissao + "T00:00:00");
    const hoje = new Date();
    return (hoje.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24) <= 30;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary/20">
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {colaborador.nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">{colaborador.nome}</h1>
                <Badge className={getStatusBadgeClass(colaborador.status || "Ativo")}>
                  {colaborador.status || "Ativo"}
                </Badge>
                {isNovaContratacao() && (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                    Nova contratação
                  </Badge>
                )}
                {colaborador.is_lider && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                    Líder
                  </Badge>
                )}
              </div>
              <p className="text-lg text-muted-foreground mb-2">{colaborador.cargo}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {colaborador.departamento}
                </span>
                {filial && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {filial.nome} {filial.cidade && `- ${filial.cidade}/${filial.estado}`}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {calculateTenure(colaborador.data_admissao)} de empresa
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              {colaborador.email && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`mailto:${colaborador.email}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </a>
                </Button>
              )}
              {colaborador.telefone && (
                <Button variant="outline" size="sm" asChild>
                  <a href={`tel:${colaborador.telefone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Ligar
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="bg-card border">
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="professional">Dados Profissionais</TabsTrigger>
            <TabsTrigger value="absences">Afastamentos</TabsTrigger>
            <TabsTrigger value="training">Treinamentos</TabsTrigger>
          </TabsList>

          {/* Dados Pessoais */}
          <TabsContent value="personal" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Informações Pessoais
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                      <p className="font-medium">
                        {colaborador.data_nascimento ? formatDate(colaborador.data_nascimento) : "Não informado"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{colaborador.cpf || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gênero</p>
                      <p className="font-medium">{colaborador.genero || "Não informado"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Contato
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{colaborador.email || "Não informado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{colaborador.telefone || "Não informado"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dados Profissionais */}
          <TabsContent value="professional" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Informações do Cargo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Cargo</p>
                      <p className="font-medium">{colaborador.cargo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento</p>
                      <p className="font-medium">{colaborador.departamento}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Admissão</p>
                      <p className="font-medium">{formatDate(colaborador.data_admissao)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                      <p className="font-medium">{colaborador.tipo_colaborador}</p>
                    </div>
                    {colaborador.data_desligamento && (
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Desligamento</p>
                        <p className="font-medium text-destructive">{formatDate(colaborador.data_desligamento)}</p>
                      </div>
                    )}
                    {contratacao?.tipo_contratacao && (
                      <div>
                        <p className="text-sm text-muted-foreground">Tipo de Contratação</p>
                        <p className="font-medium">{contratacao.tipo_contratacao}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Remuneração e Filial
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {(colaborador.salario_base ?? 0) > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Salário Base</p>
                        <p className="font-medium text-lg text-success">
                          {Number(colaborador.salario_base).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    )}
                    {(colaborador.custo_mensal ?? 0) > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground">Custo Mensal</p>
                        <p className="font-medium">
                          {Number(colaborador.custo_mensal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    )}
                    {filial && (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Filial</p>
                        <p className="font-medium">{filial.nome} ({filial.codigo})</p>
                        {filial.cidade && (
                          <p className="text-sm text-muted-foreground">{filial.cidade}/{filial.estado}</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Liderança */}
              {liderFormado && liderFormado.length > 0 && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Formação de Liderança
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {liderFormado.map((lf: any) => (
                        <div key={lf.id} className="border rounded-lg p-4">
                          <div className="flex items-center gap-3 flex-wrap">
                            {lf.nivel && <Badge variant="secondary">{lf.nivel}</Badge>}
                            <span className="text-sm text-muted-foreground">
                              Formação: {formatDate(lf.data_formacao)}
                            </span>
                          </div>
                          {lf.programa_lideranca && (
                            <p className="mt-2 text-sm">Programa: {lf.programa_lideranca}</p>
                          )}
                          {lf.observacoes && (
                            <p className="mt-1 text-sm text-muted-foreground">{lf.observacoes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Afastamentos */}
          <TabsContent value="absences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Histórico de Afastamentos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!afastamentos?.length ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum afastamento registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Período</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dias</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Observações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {afastamentos.map((a: any) => {
                          const status = getAfastamentoStatus(a.data_inicio, a.data_fim);
                          return (
                            <tr key={a.id} className="border-b last:border-0">
                              <td className="py-3 px-4">
                                <AfastamentoBadge afastamento={a} />
                              </td>
                              <td className="py-3 px-4 text-sm">
                                {formatDate(a.data_inicio)} → {formatDate(a.data_fim)}
                              </td>
                              <td className="py-3 px-4">{a.dias_afastados || "-"}</td>
                              <td className="py-3 px-4">
                                <Badge className={getAfastamentoStatusClass(status)}>{status}</Badge>
                              </td>
                              <td className="py-3 px-4 text-sm max-w-xs whitespace-pre-wrap break-words">
                                {a.observacoes || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Treinamentos */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  Treinamentos Realizados
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!treinamentos?.length ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum treinamento registrado.</p>
                ) : (
                  <div className="space-y-3">
                    {treinamentos.map((tp: any) => (
                      <div key={tp.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h4 className="font-semibold">{tp.treinamento?.nome}</h4>
                          <div className="flex items-center gap-2">
                            {tp.participou && (
                              <Badge className="bg-success/10 text-success border-success/20">Participou</Badge>
                            )}
                            {tp.certificado_emitido && (
                              <Badge variant="secondary">Certificado emitido</Badge>
                            )}
                          </div>
                        </div>
                        {tp.treinamento?.descricao && (
                          <p className="text-sm text-muted-foreground mt-1">{tp.treinamento.descricao}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          {tp.treinamento?.data_realizacao && (
                            <span>Data: {formatDate(tp.treinamento.data_realizacao)}</span>
                          )}
                          {tp.treinamento?.carga_horaria && (
                            <span>{tp.treinamento.carga_horaria}h</span>
                          )}
                          {tp.treinamento?.tipo && (
                            <Badge variant="outline">{tp.treinamento.tipo}</Badge>
                          )}
                        </div>
                        {tp.nota_avaliacao != null && (
                          <p className="text-sm mt-1">Nota: <span className="font-semibold">{tp.nota_avaliacao}</span></p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDetails;
