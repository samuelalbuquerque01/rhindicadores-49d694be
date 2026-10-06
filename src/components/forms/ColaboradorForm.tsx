import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useCreateColaborador } from "@/hooks/useColaboradores";
import { useFiliais } from "@/hooks/useFiliais";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  salario_base: z.coerce.number().min(0).optional(),
  custo_mensal: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ColaboradorFormProps {
  defaultTipo?: "CLT Administrativo" | "CLT Corpo Clínico" | "PJ" | "Estagiário";
}

export function ColaboradorForm({ defaultTipo }: ColaboradorFormProps) {
  const [open, setOpen] = useState(false);
  const createColaborador = useCreateColaborador();
  const { data: filiais } = useFiliais();

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
      tipo_colaborador: defaultTipo || "CLT Administrativo",
      tipo_contratacao: "Nova contratação",
      data_admissao: new Date().toISOString().split("T")[0],
      salario_base: 0,
      custo_mensal: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const { tipo_contratacao, ...colaboradorData } = values;
    await createColaborador.mutateAsync({
      colaborador: {
        ...colaboradorData,
        status: "Ativo",
        is_lider: false,
        filial_id: colaboradorData.filial_id || null,
        email: colaboradorData.email || null,
        genero: colaboradorData.genero || null,
      },
      tipo_contratacao,
    } as any);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Colaborador
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[600px] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl">
        <DialogHeader>
          <DialogTitle>Novo Colaborador</DialogTitle>
          <DialogDescription>
            Cadastre um novo colaborador no sistema.
          </DialogDescription>
        </DialogHeader>
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
                </div>
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
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="Nova contratação">Nova Contratação</SelectItem>
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
              disabled={createColaborador.isPending}
            >
              {createColaborador.isPending ? "Salvando..." : "Salvar Colaborador"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
