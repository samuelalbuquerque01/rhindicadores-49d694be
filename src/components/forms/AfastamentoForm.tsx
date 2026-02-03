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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateAfastamento } from "@/hooks/useAfastamentos";
import { useColaboradores } from "@/hooks/useColaboradores";

const formSchema = z.object({
  colaborador_id: z.string().min(1, "Selecione um colaborador"),
  tipo: z.enum(["Atestado médico", "Banco de horas", "Férias", "Licença maternidade", "Licença paternidade", "Outro"]),
  data_inicio: z.string().min(1, "Data início é obrigatória"),
  data_fim: z.string().min(1, "Data fim é obrigatória"),
  observacoes: z.string().max(500).optional(),
}).refine((data) => {
  // If tipo is "Outro", observacoes is required
  if (data.tipo === "Outro" && (!data.observacoes || data.observacoes.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Descrição é obrigatória para afastamentos do tipo 'Outro'",
  path: ["observacoes"],
});

type FormValues = z.infer<typeof formSchema>;

export function AfastamentoForm() {
  const [open, setOpen] = useState(false);
  const createAfastamento = useCreateAfastamento();
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colaborador_id: "",
      tipo: "Atestado médico",
      data_inicio: new Date().toISOString().split("T")[0],
      data_fim: new Date().toISOString().split("T")[0],
      observacoes: "",
    },
  });

  const tipoSelecionado = form.watch("tipo");

  const onSubmit = async (values: FormValues) => {
    await createAfastamento.mutateAsync(values as any);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Afastamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Registrar Afastamento</DialogTitle>
          <DialogDescription>
            Registre um afastamento de colaborador. O status principal do colaborador permanecerá inalterado.
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
              disabled={createAfastamento.isPending}
            >
              {createAfastamento.isPending ? "Salvando..." : "Registrar Afastamento"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
