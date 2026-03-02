import { useState, useEffect } from "react";
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
import { useCreateTreinamento, useUpdateTreinamento } from "@/hooks/useTreinamentos";
import { useFiliais } from "@/hooks/useFiliais";
import { Treinamento } from "@/types/database";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  setor_alvo: z.string().min(2, "Setor alvo e obrigatorio").max(120),
  responsavel: z.string().min(2, "Responsavel e obrigatorio").max(120),
  data_realizacao: z.string().min(1, "Data e obrigatoria"),
  carga_horaria: z.coerce.number().min(1, "Duracao e obrigatoria").max(1000),
  filial_id: z.string().optional(),
  vagas_totais: z.coerce.number().min(1, "Vagas e obrigatorio").max(1000),
});

type FormValues = z.infer<typeof formSchema>;

interface TreinamentoFormProps {
  treinamento?: Treinamento;
  trigger?: React.ReactNode;
}

export function TreinamentoForm({ treinamento, trigger }: TreinamentoFormProps) {
  const [open, setOpen] = useState(false);
  const createTreinamento = useCreateTreinamento();
  const updateTreinamento = useUpdateTreinamento();
  const { data: filiais } = useFiliais();
  const isEditing = !!treinamento;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      setor_alvo: "",
      responsavel: "",
      data_realizacao: new Date().toISOString().split("T")[0],
      carga_horaria: 8,
      filial_id: "",
      vagas_totais: 20,
    },
  });

  useEffect(() => {
    if (treinamento && open) {
      form.reset({
        nome: treinamento.nome,
        setor_alvo: treinamento.setor_alvo || "",
        responsavel: treinamento.responsavel || "",
        data_realizacao: treinamento.data_realizacao,
        carga_horaria: treinamento.carga_horaria || 8,
        filial_id: treinamento.filial_id || "",
        vagas_totais: treinamento.vagas_totais || 20,
      });
    }
  }, [treinamento, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing) {
      await updateTreinamento.mutateAsync({
        id: treinamento.id,
        ...values,
        filial_id: values.filial_id || null,
      } as any);
    } else {
      await createTreinamento.mutateAsync({
        ...values,
        filial_id: values.filial_id || null,
      } as any);
      form.reset();
    }
    setOpen(false);
  };

  const isPending = createTreinamento.isPending || updateTreinamento.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Treinamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do treinamento." : "Cadastre um novo treinamento no sistema."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Treinamento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Seguranca do Trabalho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="setor_alvo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor Alvo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Enfermagem, Administrativo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="responsavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsavel *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Ana Souza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_realizacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="carga_horaria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duracao (h) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="vagas_totais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vagas Totais *</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
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
                        <SelectValue placeholder="Selecione (ou todas)" />
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
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : isEditing ? "Atualizar Treinamento" : "Salvar Treinamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
