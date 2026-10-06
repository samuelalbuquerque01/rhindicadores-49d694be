import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock } from "lucide-react";
import { useUpdateColaborador } from "@/hooks/useColaboradores";
import { useFiliais } from "@/hooks/useFiliais";
import { useAfastamentoAtivoByColaborador } from "@/hooks/useAfastamentoAtivo";
import { Colaborador } from "@/types/database";
import { AfastamentoBadge } from "./AfastamentoBadge";
import { supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  cpf: z.string().max(14).optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().max(20).optional(),
  genero: z.enum(["Masculino", "Feminino", "Outro"]).optional(),
  cargo: z.string().min(2, "Cargo é obrigatório").max(100),
  departamento: z.string().min(2, "Departamento é obrigatório").max(100),
  filial_id: z.string().optional(),
  tipo_colaborador: z.enum(["CLT Administrativo", "CLT Corpo Clínico", "PJ", "Estagiário"]),
  tipo_contratacao: z.enum(["Nova contratação", "Readmissão", "Transferência"]),
  data_admissao: z.string().min(1, "Data de admissão é obrigatória"),
  status: z.enum(["Ativo", "Inativo"]),
  is_lider: z.boolean(),
  salario_base: z.coerce.number().min(0).optional(),
  custo_mensal: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditColaboradorModalProps {
  colaborador: Colaborador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditColaboradorModal({
  colaborador,
  open,
  onOpenChange,
}: EditColaboradorModalProps) {
  const updateColaborador = useUpdateColaborador();
  const { data: filiais } = useFiliais();
  const { data: afastamentoAtivo } = useAfastamentoAtivoByColaborador(colaborador?.id);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cpf: "",
      email: "",
      telefone: "",
      cargo: "",
      departamento: "",
      filial_id: "",
      tipo_colaborador: "CLT Administrativo",
      tipo_contratacao: "Nova contratação",
      data_admissao: "",
      status: "Ativo",
      is_lider: false,
      salario_base: 0,
      custo_mensal: 0,
    },
  });

  useEffect(() => {
    if (colaborador) {
      // Fetch contratacao to get tipo_contratacao
      const fetchContratacao = async () => {
        const { data } = await supabase
          .from("contratacoes")
          .select("tipo_contratacao")
          .eq("colaborador_id", colaborador.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        
        form.reset({
          nome: colaborador.nome,
          cpf: colaborador.cpf || "",
          email: colaborador.email || "",
          telefone: colaborador.telefone || "",
          genero: colaborador.genero as any,
          cargo: colaborador.cargo,
          departamento: colaborador.departamento,
          filial_id: colaborador.filial_id || "",
          tipo_colaborador: colaborador.tipo_colaborador as any,
          tipo_contratacao: (data?.tipo_contratacao as any) || "Nova contratação",
          data_admissao: colaborador.data_admissao,
          status: colaborador.status as any,
          is_lider: colaborador.is_lider,
          salario_base: colaborador.salario_base || 0,
          custo_mensal: colaborador.custo_mensal || 0,
        });
      };
      fetchContratacao();
    }
  }, [colaborador, form]);

  const onSubmit = async (values: FormValues) => {
    if (!colaborador) return;

    const { tipo_contratacao, ...colaboradorData } = values;

    await updateColaborador.mutateAsync({
      id: colaborador.id,
      ...colaboradorData,
      filial_id: colaboradorData.filial_id || null,
      email: colaboradorData.email || null,
      genero: colaboradorData.genero || null,
    } as any);

    // Update contratacao record
    await supabase
      .from("contratacoes")
      .update({ tipo_contratacao })
      .eq("colaborador_id", colaborador.id);

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl">
        <DialogHeader>
          <DialogTitle>Editar Colaborador</DialogTitle>
          <DialogDescription>
            Atualize os dados do colaborador.
          </DialogDescription>
        </DialogHeader>

        {/* Afastamento Ativo Alert */}
        {afastamentoAtivo && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="text-amber-800 dark:text-amber-200">
              Afastamento Ativo
            </AlertTitle>
            <AlertDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
              <AfastamentoBadge afastamento={afastamentoAtivo} showDates />
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs defaultValue="pessoal" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1">
                <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="profissional">Profissional</TabsTrigger>
              </TabsList>

              <TabsContent value="pessoal" className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do colaborador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF</FormLabel>
                        <FormControl>
                          <Input placeholder="000.000.000-00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="genero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@empresa.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 00000-0000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="profissional" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_contratacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contratação *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="Nova contratação">Nova contratação</SelectItem>
                            <SelectItem value="Readmissão">Readmissão</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data_admissao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Admissão *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_colaborador"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="CLT Administrativo">CLT Administrativo</SelectItem>
                            <SelectItem value="CLT Corpo Clínico">CLT Corpo Clínico</SelectItem>
                            <SelectItem value="PJ">PJ</SelectItem>
                            <SelectItem value="Estagiário">Estagiário</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="filial_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Filial</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-popover z-50">
                          {filiais?.map((filial) => (
                            <SelectItem key={filial.id} value={filial.id}>
                              {filial.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cargo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Analista" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="departamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Departamento *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: RH" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="data_admissao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Admissão *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salario_base"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salário Base (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="custo_mensal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custo Mensal (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <Button
              type="submit"
              className="w-full"
              disabled={updateColaborador.isPending}
            >
              {updateColaborador.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
