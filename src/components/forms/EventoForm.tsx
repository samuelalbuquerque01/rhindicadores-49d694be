import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
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
import { useCreateEvento, useUpdateEvento } from "@/hooks/useEventos";
import { useFiliais } from "@/hooks/useFiliais";
import { Evento } from "@/types/database";

const formSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(200),
  descricao: z.string().max(500).optional(),
  data_evento: z.string().min(1, "Data é obrigatória"),
  filial_id: z.string().optional(),
  tipo: z.enum(["Confraternização", "Palestra", "Workshop", "Integração", "Outro"]).optional(),
  capacidade: z.coerce.number().min(1).max(10000).optional(),
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
      descricao: "",
      data_evento: new Date().toISOString().split("T")[0],
      filial_id: "",
      tipo: "Confraternização",
      capacidade: 50,
    },
  });

  useEffect(() => {
    if (evento && open) {
      form.reset({
        nome: evento.nome,
        descricao: evento.descricao || "",
        data_evento: evento.data_evento,
        filial_id: evento.filial_id || "",
        tipo: (evento.tipo as "Confraternização" | "Palestra" | "Workshop" | "Integração" | "Outro") || "Confraternização",
        capacidade: evento.capacidade || 50,
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
        capacidade: values.capacidade || null,
      } as any);
    } else {
      await createEvento.mutateAsync({
        ...values,
        filial_id: values.filial_id || null,
        tipo: values.tipo || null,
        capacidade: values.capacidade || null,
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
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Evento" : "Novo Evento"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do evento." : "Cadastre um novo evento no sistema."}
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
                    <Input placeholder="Ex: Festa de fim de ano" {...field} />
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
                    <Textarea placeholder="Descreva o evento..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
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
                        <SelectItem value="Confraternização">Confraternização</SelectItem>
                        <SelectItem value="Palestra">Palestra</SelectItem>
                        <SelectItem value="Workshop">Workshop</SelectItem>
                        <SelectItem value="Integração">Integração</SelectItem>
                        <SelectItem value="Outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade</FormLabel>
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
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? "Salvando..." : isEditing ? "Atualizar Evento" : "Salvar Evento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
