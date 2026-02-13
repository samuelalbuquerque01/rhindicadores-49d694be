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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useUpdateAfastamento } from "@/hooks/useAfastamentos";

const formSchema = z.object({
  tipo: z.enum(["Atestado médico", "Banco de horas", "Férias", "Licença maternidade", "Licença paternidade", "Outro"]),
  data_inicio: z.string().min(1, "Data início é obrigatória"),
  data_fim: z.string().min(1, "Data fim é obrigatória"),
  observacoes: z.string().max(500).optional(),
}).refine((data) => {
  if (data.tipo === "Outro" && (!data.observacoes || data.observacoes.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Descrição é obrigatória para afastamentos do tipo 'Outro'",
  path: ["observacoes"],
});

type FormValues = z.infer<typeof formSchema>;

interface EditAfastamentoModalProps {
  afastamento: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAfastamentoModal({ afastamento, open, onOpenChange }: EditAfastamentoModalProps) {
  const updateAfastamento = useUpdateAfastamento();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo: "Atestado médico",
      data_inicio: "",
      data_fim: "",
      observacoes: "",
    },
  });

  useEffect(() => {
    if (afastamento) {
      form.reset({
        tipo: afastamento.tipo || "Atestado médico",
        data_inicio: afastamento.data_inicio || "",
        data_fim: afastamento.data_fim || "",
        observacoes: afastamento.observacoes || "",
      });
    }
  }, [afastamento, form]);

  const tipoSelecionado = form.watch("tipo");

  const onSubmit = async (values: FormValues) => {
    await updateAfastamento.mutateAsync({
      id: afastamento.id,
      tipo: values.tipo,
      data_inicio: values.data_inicio,
      data_fim: values.data_fim,
      observacoes: values.observacoes,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Editar Afastamento</DialogTitle>
          <DialogDescription>
            {afastamento?.colaborador?.nome && (
              <>Colaborador: <strong>{afastamento.colaborador.nome}</strong></>
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Afastamento *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Atestado médico">Atestado médico</SelectItem>
                      <SelectItem value="Banco de horas">Banco de horas</SelectItem>
                      <SelectItem value="Férias">Férias</SelectItem>
                      <SelectItem value="Licença maternidade">Licença maternidade</SelectItem>
                      <SelectItem value="Licença paternidade">Licença paternidade</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Início *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Fim *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Observações {tipoSelecionado === "Outro" && "*"}
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={
                        tipoSelecionado === "Outro" 
                          ? "Descreva o motivo do afastamento (obrigatório)..." 
                          : "Observações adicionais..."
                      } 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={updateAfastamento.isPending}
            >
              {updateAfastamento.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
