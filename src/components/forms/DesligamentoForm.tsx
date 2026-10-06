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
import { useCreateDesligamento } from "@/hooks/useDesligamentos";
import { useColaboradores } from "@/hooks/useColaboradores";

const formSchema = z.object({
  colaborador_id: z.string().min(1, "Selecione um colaborador"),
  data_desligamento: z.string().min(1, "Data é obrigatória"),
  motivo: z.enum(["Pedido de demissão", "Iniciativa da empresa", "Término de contrato"]),
  custo_rescisao: z.coerce.number().min(0).optional(),
  observacoes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function DesligamentoForm() {
  const [open, setOpen] = useState(false);
  const createDesligamento = useCreateDesligamento();
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colaborador_id: "",
      data_desligamento: new Date().toISOString().split("T")[0],
      motivo: "Pedido de demissão",
      custo_rescisao: 0,
      observacoes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createDesligamento.mutateAsync(values as any);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Desligamento
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Desligamento</DialogTitle>
          <DialogDescription>
            Registre o desligamento de um colaborador.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="colaborador_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Colaborador *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione o colaborador" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-popover z-50 max-h-[200px]">
                      {colaboradores?.map((colaborador) => (
                        <SelectItem key={colaborador.id} value={colaborador.id}>
                          {colaborador.nome} - {colaborador.cargo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              disabled={createDesligamento.isPending}
            >
              {createDesligamento.isPending ? "Salvando..." : "Registrar Desligamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
