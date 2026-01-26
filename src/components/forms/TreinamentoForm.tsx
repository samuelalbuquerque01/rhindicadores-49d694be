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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTreinamento } from "@/hooks/useTreinamentos";
import { useFiliais } from "@/hooks/useFiliais";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  descricao: z.string().max(500).optional(),
  data_realizacao: z.string().min(1, "Data é obrigatória"),
  carga_horaria: z.coerce.number().min(1, "Carga horária é obrigatória").max(1000),
  filial_id: z.string().optional(),
  tipo: z.enum(["Presencial", "Online", "Híbrido"]).optional(),
  vagas_totais: z.coerce.number().min(1, "Vagas é obrigatório").max(1000),
});

type FormValues = z.infer<typeof formSchema>;

export function TreinamentoForm() {
  const [open, setOpen] = useState(false);
  const createTreinamento = useCreateTreinamento();
  const { data: filiais } = useFiliais();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      data_realizacao: new Date().toISOString().split("T")[0],
      carga_horaria: 8,
      filial_id: "",
      tipo: "Presencial",
      vagas_totais: 20,
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createTreinamento.mutateAsync({
      ...values,
      filial_id: values.filial_id || null,
      tipo: values.tipo || null,
    } as any);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Treinamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Novo Treinamento</DialogTitle>
          <DialogDescription>
            Cadastre um novo treinamento no sistema.
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
                    <Input placeholder="Ex: Segurança do Trabalho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descreva o treinamento..." {...field} />
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
                    <FormLabel>Carga Horária (h) *</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Presencial">Presencial</SelectItem>
                        <SelectItem value="Online">Online</SelectItem>
                        <SelectItem value="Híbrido">Híbrido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              disabled={createTreinamento.isPending}
            >
              {createTreinamento.isPending ? "Salvando..." : "Salvar Treinamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
