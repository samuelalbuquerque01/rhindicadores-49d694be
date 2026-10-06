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
import { useCreateEvento, useUpdateEvento } from "@/hooks/useEventos";
import { useFiliais } from "@/hooks/useFiliais";
import { Evento } from "@/types/database";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  tipo: z
    .enum([
      "Confraterniza????o",
      "Palestra",
      "Workshop",
      "Integra????o",
      "Treinamento",
      "Corporativo",
      "Outro",
    ])
    .optional(),
  data_evento: z.string().min(1, "Data e obrigatoria"),
  setor_alvo: z.string().min(2, "Setor alvo e obrigatorio").max(120),
  responsavel: z.string().min(2, "Responsavel e obrigatorio").max(120),
  filial_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EventoFormProps {
  evento?: Evento;
  trigger?: React.ReactNode;
}

export function EventoForm({ evento, trigger }: EventoFormProps) {
  const [open, setOpen] = useState(false);
  const createEvento = useCreateEvento();
  const updateEvento = useUpdateEvento();
  const { data: filiais } = useFiliais();
  const isEditing = !!evento;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      tipo: "Confraterniza????o",
      data_evento: new Date().toISOString().split("T")[0],
      setor_alvo: "",
      responsavel: "",
      filial_id: "",
    },
  });

  useEffect(() => {
    if (evento && open) {
      form.reset({
        nome: evento.nome,
        tipo: (evento.tipo as
          | "Confraterniza????o"
          | "Palestra"
          | "Workshop"
          | "Integra????o"
          | "Treinamento"
          | "Corporativo"
          | "Outro") || "Confraterniza????o",
        data_evento: evento.data_evento,
        setor_alvo: evento.setor_alvo || "",
        responsavel: evento.responsavel || "",
        filial_id: evento.filial_id || "",
      });
    }
  }, [evento, open, form]);

  const onSubmit = async (values: FormValues) => {
    if (isEditing) {
      await updateEvento.mutateAsync({
        id: evento.id,
        ...values,
        filial_id: values.filial_id || null,
        tipo: values.tipo || null,
      } as any);
    } else {
      await createEvento.mutateAsync({
        ...values,
        filial_id: values.filial_id || null,
        tipo: values.tipo || null,
      } as any);
      form.reset();
    }
    setOpen(false);
  };

  const isPending = createEvento.isPending || updateEvento.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados do evento."
              : "Cadastre um novo evento no sistema."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Evento *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Encontro de Liderancas" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <SelectItem value="Treinamento">Treinamento</SelectItem>
                        <SelectItem value="Integra????o">Integracao</SelectItem>
                        <SelectItem value="Corporativo">Corporativo</SelectItem>
                        <SelectItem value="Confraterniza????o">Confraternizacao</SelectItem>
                        <SelectItem value="Palestra">Palestra</SelectItem>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_evento"
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
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="setor_alvo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor Alvo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Recepcao" {...field} />
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
                      <Input placeholder="Ex: Carla Dias" {...field} />
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
                        <SelectValue placeholder="Todas" />
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
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Salvando..." : isEditing ? "Atualizar Evento" : "Salvar Evento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
