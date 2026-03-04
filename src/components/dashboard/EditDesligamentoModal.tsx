import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
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
import { useUpdateDesligamento } from "@/hooks/useDesligamentos";

const formSchema = z.object({
  data_desligamento: z.string().min(1, "Data é obrigatória"),
  motivo: z.enum(["Pedido de demissão", "Iniciativa da empresa", "Término de contrato"]),
  custo_rescisao: z.coerce.number().min(0).optional(),
  observacoes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditDesligamentoModalProps {
  desligamento: {
    id: string;
    data_desligamento: string;
    motivo: string;
    custo_rescisao: number | null;
    observacoes: string | null;
    nome?: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDesligamentoModal({ desligamento, open, onOpenChange }: EditDesligamentoModalProps) {
  const updateDesligamento = useUpdateDesligamento();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      data_desligamento: "",
      motivo: "Pedido de demissão",
      custo_rescisao: 0,
      observacoes: "",
    },
  });

  useEffect(() => {
    if (desligamento) {
      form.reset({
        data_desligamento: desligamento.data_desligamento,
        motivo: desligamento.motivo as any,
        custo_rescisao: desligamento.custo_rescisao || 0,
        observacoes: desligamento.observacoes || "",
      });
    }
  }, [desligamento, form]);

  const onSubmit = async (values: FormValues) => {
    if (!desligamento) return;
    await updateDesligamento.mutateAsync({
      id: desligamento.id,
      ...values,
      observacoes: values.observacoes || null,
      custo_rescisao: values.custo_rescisao || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>
            Editar Desligamento{desligamento?.nome ? ` — ${desligamento.nome}` : ""}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_desligamento"
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
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Pedido de demissão">Pedido de demissão</SelectItem>
                        <SelectItem value="Iniciativa da empresa">Iniciativa da empresa</SelectItem>
                        <SelectItem value="Término de contrato">Término de contrato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="custo_rescisao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custo da Rescisão (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full"
              disabled={updateDesligamento.isPending}
            >
              {updateDesligamento.isPending ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
