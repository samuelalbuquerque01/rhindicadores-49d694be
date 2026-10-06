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
import { useCreateLiderFormado } from "@/hooks/useLideres";
import { useColaboradores } from "@/hooks/useColaboradores";

const formSchema = z.object({
  colaborador_id: z.string().min(1, "Selecione um colaborador"),
  data_formacao: z.string().min(1, "Data é obrigatória"),
  programa_lideranca: z.string().max(200).optional(),
  nivel: z.enum(["Supervisor", "Coordenador", "Gerente", "Diretor"]),
  observacoes: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function LiderForm() {
  const [open, setOpen] = useState(false);
  const createLider = useCreateLiderFormado();
  const { data: colaboradores } = useColaboradores({ status: "Ativo" });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      colaborador_id: "",
      data_formacao: new Date().toISOString().split("T")[0],
      programa_lideranca: "",
      nivel: "Supervisor",
      observacoes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createLider.mutateAsync({
      ...values,
      programa_lideranca: values.programa_lideranca || null,
    } as any);
    form.reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Novo Líder
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Líder Formado</DialogTitle>
          <DialogDescription>
            Registre um novo líder formado pela empresa.
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
                name="data_formacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Formação *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                        <SelectItem value="Coordenador">Coordenador</SelectItem>
                        <SelectItem value="Gerente">Gerente</SelectItem>
                        <SelectItem value="Diretor">Diretor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="programa_lideranca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Programa de Liderança</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Líderes do Futuro 2024" {...field} />
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
              disabled={createLider.isPending}
            >
              {createLider.isPending ? "Salvando..." : "Registrar Líder"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
