import { useParams, useNavigate } from "react-router-dom";
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
  GraduationCap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

// Mock data - em produção viria do backend
const employeeData = {
  id: "1",
  name: "Ana Paula Santos",
  email: "ana.santos@empresa.com",
  phone: "(11) 99999-8888",
  avatar: "",
  position: "Analista de RH Sênior",
  department: "Recursos Humanos",
  manager: "Carlos Eduardo Lima",
  status: "Ativo",
  hireDate: "2020-03-15",
  birthDate: "1990-07-22",
  address: "Rua das Flores, 123 - São Paulo, SP",
  cpf: "***.***.***-12",
  rg: "**.***.**1-2",
  ctps: "******.****-**",
  pis: "***.*****.**-*",
  salary: 8500,
  workHours: "44h semanais",
  contractType: "CLT",
  education: "Pós-graduação em Gestão de Pessoas",
  certifications: ["SHRM-CP", "PHR", "Coach Executivo"],
  skills: ["Recrutamento", "Treinamento", "Gestão de Conflitos", "Folha de Pagamento", "Benefícios"],
};

const careerHistory = [
  { date: "2023-06", title: "Promoção", description: "Analista de RH Sênior", type: "promotion" },
  { date: "2022-03", title: "Aumento Salarial", description: "Reajuste de 12%", type: "salary" },
  { date: "2021-08", title: "Certificação", description: "SHRM-CP obtida", type: "certification" },
  { date: "2020-09", title: "Efetivação", description: "Término do período de experiência", type: "milestone" },
  { date: "2020-03", title: "Admissão", description: "Analista de RH Pleno", type: "hire" },
];

const evaluations = [
  { 
    period: "2024 S1", 
    score: 4.5, 
    maxScore: 5, 
    evaluator: "Carlos Eduardo Lima",
    date: "2024-06-30",
    strengths: ["Comunicação", "Proatividade", "Trabalho em equipe"],
    improvements: ["Delegação de tarefas"],
    comments: "Excelente desempenho no semestre. Demonstrou liderança natural em projetos críticos."
  },
  { 
    period: "2023 S2", 
    score: 4.2, 
    maxScore: 5, 
    evaluator: "Carlos Eduardo Lima",
    date: "2023-12-20",
    strengths: ["Organização", "Conhecimento técnico"],
    improvements: ["Gestão de tempo"],
    comments: "Bom desempenho geral. Recomendado para programa de desenvolvimento de líderes."
  },
  { 
    period: "2023 S1", 
    score: 4.0, 
    maxScore: 5, 
    evaluator: "Carlos Eduardo Lima",
    date: "2023-06-28",
    strengths: ["Comprometimento", "Qualidade das entregas"],
    improvements: ["Comunicação assertiva", "Apresentações"],
    comments: "Evoluiu significativamente em relação ao período anterior."
  },
];

const absenceHistory = [
  { date: "2024-01-15", type: "Férias", days: 10, status: "Aprovado" },
  { date: "2023-11-20", type: "Atestado Médico", days: 2, status: "Justificado" },
  { date: "2023-07-03", type: "Férias", days: 15, status: "Aprovado" },
  { date: "2023-03-10", type: "Falta", days: 1, status: "Injustificado" },
];

const documents = [
  { name: "Contrato de Trabalho", date: "2020-03-15", type: "contract" },
  { name: "Termo Aditivo - Promoção", date: "2023-06-01", type: "amendment" },
  { name: "Avaliação 2024 S1", date: "2024-06-30", type: "evaluation" },
  { name: "Certificado SHRM-CP", date: "2021-08-15", type: "certificate" },
];

const getHistoryIcon = (type: string) => {
  switch (type) {
    case "promotion": return <TrendingUp className="h-4 w-4 text-success" />;
    case "salary": return <Award className="h-4 w-4 text-warning" />;
    case "certification": return <GraduationCap className="h-4 w-4 text-info" />;
    case "milestone": return <Star className="h-4 w-4 text-primary" />;
    case "hire": return <Briefcase className="h-4 w-4 text-primary" />;
    default: return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Aprovado": return "bg-success/10 text-success border-success/20";
    case "Justificado": return "bg-info/10 text-info border-info/20";
    case "Injustificado": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "bg-muted text-muted-foreground";
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatMonthYear = (dateStr: string) => {
  const [year, month] = dateStr.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month) - 1]} ${year}`;
};

const calculateTenure = (hireDate: string) => {
  const hire = new Date(hireDate);
  const now = new Date();
  const years = now.getFullYear() - hire.getFullYear();
  const months = now.getMonth() - hire.getMonth();
  
  if (months < 0) {
    return `${years - 1} anos e ${12 + months} meses`;
  }
  return `${years} anos e ${months} meses`;
};

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const employee = employeeData; // Em produção, buscar por ID

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
              <AvatarImage src={employee.avatar} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{employee.name}</h1>
                <Badge className="bg-success/10 text-success border-success/20">{employee.status}</Badge>
              </div>
              <p className="text-lg text-muted-foreground mb-2">{employee.position}</p>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {employee.department}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Gestor: {employee.manager}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {calculateTenure(employee.hireDate)} de empresa
                </span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </Button>
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
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="evaluations">Avaliações</TabsTrigger>
            <TabsTrigger value="absences">Afastamentos</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
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
                      <p className="font-medium">{formatDate(employee.birthDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium">{employee.cpf}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RG</p>
                      <p className="font-medium">{employee.rg}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">PIS</p>
                      <p className="font-medium">{employee.pis}</p>
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
                    <p className="font-medium">{employee.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium">{employee.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{employee.address}</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    Formação e Certificações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Formação Acadêmica</p>
                    <p className="font-medium">{employee.education}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Certificações</p>
                    <div className="flex flex-wrap gap-2">
                      {employee.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="secondary">{cert}</Badge>
                      ))}
                    </div>
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
                      <p className="font-medium">{employee.position}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Departamento</p>
                      <p className="font-medium">{employee.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Admissão</p>
                      <p className="font-medium">{formatDate(employee.hireDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Contrato</p>
                      <p className="font-medium">{employee.contractType}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Jornada e Remuneração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Carga Horária</p>
                      <p className="font-medium">{employee.workHours}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CTPS</p>
                      <p className="font-medium">{employee.ctps}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Salário Base</p>
                      <p className="font-medium text-lg text-success">
                        {employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Competências
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {employee.skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-primary/10 text-primary border-primary/20">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Histórico */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Linha do Tempo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {careerHistory.map((event, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-2 top-1 p-1 bg-card border rounded-full">
                          {getHistoryIcon(event.type)}
                        </div>
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-foreground">{event.title}</h4>
                            <span className="text-sm text-muted-foreground">{formatMonthYear(event.date)}</span>
                          </div>
                          <p className="text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Avaliações */}
          <TabsContent value="evaluations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resumo */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Resumo de Desempenho
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary">4.2</div>
                    <p className="text-muted-foreground">Média Geral</p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Comunicação</span>
                        <span>4.5</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Proatividade</span>
                        <span>4.3</span>
                      </div>
                      <Progress value={86} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Trabalho em Equipe</span>
                        <span>4.5</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Conhecimento Técnico</span>
                        <span>4.0</span>
                      </div>
                      <Progress value={80} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Avaliações */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Histórico de Avaliações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {evaluations.map((evaluation, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{evaluation.period}</Badge>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            <span className="font-semibold">{evaluation.score}/{evaluation.maxScore}</span>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatDate(evaluation.date)}</span>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Pontos Fortes</p>
                          <div className="flex flex-wrap gap-1">
                            {evaluation.strengths.map((s, i) => (
                              <Badge key={i} className="bg-success/10 text-success border-success/20 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-2">Pontos de Melhoria</p>
                          <div className="flex flex-wrap gap-1">
                            {evaluation.improvements.map((s, i) => (
                              <Badge key={i} className="bg-warning/10 text-warning border-warning/20 text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Comentários</p>
                        <p className="text-sm">{evaluation.comments}</p>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">Avaliador: {evaluation.evaluator}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
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
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Data</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Dias</th>
                        <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {absenceHistory.map((absence, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="py-3 px-4">{formatDate(absence.date)}</td>
                          <td className="py-3 px-4">{absence.type}</td>
                          <td className="py-3 px-4">{absence.days}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(absence.status)}>{absence.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos do Colaborador
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {documents.map((doc, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(doc.date)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Visualizar
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDetails;
