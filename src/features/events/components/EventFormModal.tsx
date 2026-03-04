import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagsInput } from "@/components/ui/TagsInput";
import { AttachmentsListUpload } from "@/components/ui/AttachmentsListUpload";
import {
  EventRecord,
  INSTITUTIONAL_EVENT_TYPES,
  InstitutionalEventType,
  LocalAttachment,
  createAttachmentId,
} from "@/lib/storage/eventsStorage";

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectors: string[];
  initialEvent?: EventRecord | null;
  onSave: (event: Omit<EventRecord, "auditTrail"> & { id?: string }) => void;
}

interface FormState {
  title: string;
  type: InstitutionalEventType;
  date: string;
  location: string;
  organizer: string;
  sectors: string[];
  estimatedParticipants: string;
  description: string;
  tags: string[];
  attachments: LocalAttachment[];
}

interface FormErrors {
  title?: string;
  date?: string;
}

function initialState(record?: EventRecord | null): FormState {
  return {
    title: record?.title || "",
    type: record?.type || "Confraternizacao",
    date: record?.date || new Date().toISOString().split("T")[0],
    location: record?.location || "",
    organizer: record?.organizer || "",
    sectors: record?.sectors || [],
    estimatedParticipants: record?.estimatedParticipants?.toString() || "",
    description: record?.description || "",
    tags: record?.tags || [],
    attachments: record?.attachments || [],
  };
}

export function EventFormModal({
  open,
  onOpenChange,
  sectors,
  initialEvent,
  onSave,
}: EventFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => initialState(initialEvent));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setFormState(initialState(initialEvent));
      setErrors({});
    }
  }, [initialEvent, open]);

  const save = () => {
    const nextErrors: FormErrors = {};
    if (!formState.title.trim()) {
      nextErrors.title = "Titulo obrigatorio.";
    }
    if (!formState.date) {
      nextErrors.date = "Data obrigatoria.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const estimatedParticipants = Number(formState.estimatedParticipants);

    onSave({
      id: initialEvent?.id,
      title: formState.title.trim(),
      type: formState.type,
      date: formState.date,
      location: formState.location.trim(),
      organizer: formState.organizer.trim(),
      sectors: formState.sectors,
      estimatedParticipants:
        Number.isNaN(estimatedParticipants) || estimatedParticipants < 0 ? null : estimatedParticipants,
      description: formState.description.trim(),
      tags: formState.tags,
      attachments: formState.attachments,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[860px] max-h-[88vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle>{initialEvent ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>
            Registro institucional de eventos de RH.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Titulo *</Label>
              <Input
                value={formState.title}
                onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
                placeholder="Ex: Semana da Cultura Organizacional"
              />
              {errors.title ? <p className="text-xs text-destructive">{errors.title}</p> : null}
            </div>

            <div className="space-y-2">
              <Label>Tipo *</Label>
              <Select
                value={formState.type}
                onValueChange={(value) =>
                  setFormState((current) => ({ ...current, type: value as InstitutionalEventType }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Tipo do evento" />
                </SelectTrigger>
                <SelectContent>
                  {INSTITUTIONAL_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1 space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))}
              />
              {errors.date ? <p className="text-xs text-destructive">{errors.date}</p> : null}
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label>Local</Label>
              <Input
                value={formState.location}
                onChange={(event) => setFormState((current) => ({ ...current, location: event.target.value }))}
                placeholder="Ex: Auditorio Matriz"
              />
            </div>
            <div className="space-y-2">
              <Label>Participantes estimados</Label>
              <Input
                type="number"
                min={0}
                value={formState.estimatedParticipants}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, estimatedParticipants: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Organizador</Label>
            <Input
              value={formState.organizer}
              onChange={(event) => setFormState((current) => ({ ...current, organizer: event.target.value }))}
              placeholder="Ex: RH Corporativo"
            />
          </div>

          <div className="space-y-2">
            <Label>Setores envolvidos</Label>
            <TagsInput
              value={formState.sectors}
              onChange={(value) => setFormState((current) => ({ ...current, sectors: value }))}
              suggestions={sectors}
              placeholder="Adicione setores envolvidos"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagsInput
              value={formState.tags}
              onChange={(value) => setFormState((current) => ({ ...current, tags: value }))}
              suggestions={["Cultura", "Endomarketing", "Compliance", "Lideranca", "Bem-estar", "Engajamento"]}
              placeholder="Ex: Cultura, Compliance"
            />
          </div>

          <div className="space-y-2">
            <Label>Descricao</Label>
            <Textarea
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              placeholder="Resumo do objetivo institucional do evento."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexos (fotos/documentos)</Label>
            <AttachmentsListUpload
              items={formState.attachments}
              onChange={(attachments) => setFormState((current) => ({ ...current, attachments }))}
              createId={createAttachmentId}
            />
          </div>

          <div className="rounded-md border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
            Sincronizacao de evento/tags/auditoria em Supabase ativa. TODO: mover anexos para bucket (Storage) em vez de URL local.
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save}>
              {initialEvent ? "Salvar alteracoes" : "Registrar evento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
