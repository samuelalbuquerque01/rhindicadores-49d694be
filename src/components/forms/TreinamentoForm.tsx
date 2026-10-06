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
import { TagsInput } from "@/components/ui/TagsInput";
import { AttachmentsListUpload } from "@/components/ui/AttachmentsListUpload";
import {
  createFallbackAttachmentId,
  readTrainingExtraById,
  upsertTrainingExtra,
} from "@/lib/storage/trainingsStorage";
import { LocalAttachment } from "@/lib/storage/eventsStorage";

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

const TAG_SUGGESTIONS = [
  "Obrigatorio",
  "Reciclagem",
  "Lideranca",
  "Compliance",
  "Seguranca",
  "Onboarding",
  "Comunicacao",
];

export function TreinamentoForm({ treinamento, trigger }: TreinamentoFormProps) {
  const [open, setOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<LocalAttachment[]>([]);
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
    if (!open) return;

    if (treinamento) {
      form.reset({
        nome: treinamento.nome,
        setor_alvo: treinamento.setor_alvo || "",
        responsavel: treinamento.responsavel || "",
        data_realizacao: treinamento.data_realizacao,
        carga_horaria: treinamento.carga_horaria || 8,
        filial_id: treinamento.filial_id || "",
        vagas_totais: treinamento.vagas_totais || 20,
      });

      const extra = readTrainingExtraById(treinamento.id);
      setTags(extra?.tags || []);
      setAttachments(extra?.attachments || []);
      return;
    }

    form.reset({
      nome: "",
      setor_alvo: "",
      responsavel: "",
      data_realizacao: new Date().toISOString().split("T")[0],
      carga_horaria: 8,
      filial_id: "",
      vagas_totais: 20,
    });
    setTags([]);
    setAttachments([]);
  }, [form, open, treinamento]);

  const submit = async (values: FormValues, keepOpen: boolean) => {
    const payload: Omit<Treinamento, "id" | "created_at" | "filial"> = {
      nome: values.nome,
      descricao: undefined,
      data_realizacao: values.data_realizacao,
      carga_horaria: values.carga_horaria,
      filial_id: values.filial_id || null,
      tipo: undefined,
      vagas_totais: values.vagas_totais,
      setor_alvo: values.setor_alvo,
      responsavel: values.responsavel,
      finalizado: false,
    };

    let trainingId = treinamento?.id || "";

    if (isEditing && treinamento) {
      await updateTreinamento.mutateAsync({
        id: treinamento.id,
        ...payload,
      });
      trainingId = treinamento.id;
    } else {
      const created = await createTreinamento.mutateAsync(payload);
      trainingId = created.id;
    }

    if (trainingId) {
      upsertTrainingExtra(trainingId, {
        tags,
        attachments,
        snapshot: {
          nome: values.nome,
          data_realizacao: values.data_realizacao,
          setor_alvo: values.setor_alvo,
          responsavel: values.responsavel,
          carga_horaria: values.carga_horaria,
          vagas_totais: values.vagas_totais,
        },
      });
    }

    if (!isEditing && keepOpen) {
      form.reset({
        nome: "",
        setor_alvo: values.setor_alvo,
        responsavel: values.responsavel,
        data_realizacao: new Date().toISOString().split("T")[0],
        carga_horaria: values.carga_horaria,
        filial_id: values.filial_id || "",
        vagas_totais: values.vagas_totais,
      });
      setTags([]);
      setAttachments([]);
      return;
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
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Treinamento" : "Novo Treinamento"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Atualize os dados do treinamento." : "Cadastre um novo treinamento no sistema."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => submit(values, false))} className="space-y-4">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

            <div className="space-y-2">
              <FormLabel>Tags do treinamento</FormLabel>
              <TagsInput value={tags} onChange={setTags} suggestions={TAG_SUGGESTIONS} />
            </div>

            <div className="space-y-2">
              <FormLabel>Anexos</FormLabel>
              <AttachmentsListUpload
                items={attachments}
                onChange={setAttachments}
                createId={createFallbackAttachmentId}
              />
            </div>

            <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
              TODO: tags/anexos/historico de treinamentos estao em localStorage ate disponibilizar backend dedicado.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Salvando..." : isEditing ? "Atualizar Treinamento" : "Salvar Treinamento"}
              </Button>
              {!isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={isPending}
                  onClick={form.handleSubmit((values) => submit(values, true))}
                >
                  Salvar e registrar outro
                </Button>
              ) : null}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
