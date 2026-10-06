import { useEffect, useState, type ChangeEvent } from "react";
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
import { Download, ExternalLink, Paperclip, X } from "lucide-react";
import {
  createAfastamentoSignedUrl,
  downloadAfastamentoAnexo,
  isHttpUrl,
} from "@/lib/afastamentosStorage";
import { toast } from "sonner";

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
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [removeAnexo, setRemoveAnexo] = useState(false);

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
      setAnexoFile(null);
      setRemoveAnexo(false);
    }
  }, [afastamento, form]);

  const tipoSelecionado = form.watch("tipo");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setAnexoFile(null);
      return;
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato inválido. Envie PDF, JPG ou PNG.");
      event.target.value = "";
      setAnexoFile(null);
      return;
    }

    setAnexoFile(file);
    setRemoveAnexo(false);
  };

  const handleViewAnexo = async () => {
    if (!afastamento?.anexo_url) return;
    try {
      if (isHttpUrl(afastamento.anexo_url)) {
        window.open(afastamento.anexo_url, "_blank", "noopener,noreferrer");
        return;
      }
      const signedUrl = await createAfastamentoSignedUrl(afastamento.anexo_url);
      if (signedUrl) window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(`Erro ao visualizar anexo: ${error.message}`);
    }
  };

  const handleDownloadAnexo = async () => {
    if (!afastamento?.anexo_url) return;
    try {
      if (isHttpUrl(afastamento.anexo_url)) {
        window.open(afastamento.anexo_url, "_blank", "noopener,noreferrer");
        return;
      }
      const blob = await downloadAfastamentoAnexo(afastamento.anexo_url);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = afastamento.anexo_url.split("/").pop() || "anexo";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast.error(`Erro ao baixar anexo: ${error.message}`);
    }
  };

  const onSubmit = async (values: FormValues) => {
    await updateAfastamento.mutateAsync({
      id: afastamento.id,
      tipo: values.tipo,
      data_inicio: values.data_inicio,
      data_fim: values.data_fim,
      observacoes: values.observacoes,
      colaborador_id: afastamento.colaborador_id,
      anexoFile,
      removeAnexo,
      currentAnexoUrl: afastamento.anexo_url,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-h-[90vh] overflow-y-auto border-border bg-background shadow-xl sm:max-w-[500px]">
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="space-y-2">
              <FormLabel className="flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Documento anexado
              </FormLabel>
              {afastamento?.anexo_url && !removeAnexo ? (
                <div className="flex flex-col gap-2 rounded-md border border-border/60 p-3">
                  <span className="text-xs text-muted-foreground truncate">
                    {afastamento.anexo_url.split("/").pop()}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={handleViewAnexo}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={handleDownloadAnexo}>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => setRemoveAnexo(true)}
                    >
                      Remover anexo
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum documento anexado.</p>
              )}
              {removeAnexo && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRemoveAnexo(false)}
                >
                  Desfazer remoção
                </Button>
              )}
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              {anexoFile && (
                <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-xs">
                  <span className="truncate">{anexoFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAnexoFile(null)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, JPG, PNG.
              </p>
            </div>
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
