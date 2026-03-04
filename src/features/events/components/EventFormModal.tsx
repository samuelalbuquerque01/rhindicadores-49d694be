import { useEffect, useMemo, useState } from "react";
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
import {
  createEventId,
  RH_EVENT_TYPES,
  type HREventRecord,
  type RHEventType,
} from "@/lib/analytics/events";

export interface EventEmployeeOption {
  id: string;
  name: string;
  sectorId?: string | null;
  sectorName?: string | null;
}

interface EventFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: EventEmployeeOption[];
  sectors: string[];
  initialEvent?: HREventRecord | null;
  onSave: (event: HREventRecord) => void;
}

interface FormState {
  type: RHEventType;
  employeeId: string;
  sectorName: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes: string;
  attachmentUrl: string;
  employeeSearch: string;
}

interface FormErrors {
  startDate?: string;
  endDate?: string;
  reason?: string;
}

const REASON_REQUIRED_TYPES: RHEventType[] = ["Afastamento", "Desligamento", "Advertência"];

function buildInitialFormState(initialEvent?: HREventRecord | null): FormState {
  return {
    type: initialEvent?.type ?? "Afastamento",
    employeeId: initialEvent?.employeeId ?? "",
    sectorName: initialEvent?.sectorName ?? "",
    startDate: initialEvent?.startDate ?? "",
    endDate: initialEvent?.endDate ?? "",
    reason: initialEvent?.reason ?? "",
    notes: initialEvent?.notes ?? "",
    attachmentUrl: initialEvent?.attachmentUrl ?? "",
    employeeSearch: "",
  };
}

export function EventFormModal({
  open,
  onOpenChange,
  employees,
  sectors,
  initialEvent,
  onSave,
}: EventFormModalProps) {
  const [formState, setFormState] = useState<FormState>(() => buildInitialFormState(initialEvent));
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) {
      setFormState(buildInitialFormState(initialEvent));
      setErrors({});
    }
  }, [initialEvent, open]);

  const filteredEmployees = useMemo(() => {
    const term = formState.employeeSearch.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((employee) => employee.name.toLowerCase().includes(term));
  }, [employees, formState.employeeSearch]);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === formState.employeeId),
    [employees, formState.employeeId],
  );

  const validate = (): FormErrors => {
    const nextErrors: FormErrors = {};

    if (!formState.startDate) {
      nextErrors.startDate = "Data inicial obrigatoria.";
    }

    if (formState.endDate && formState.startDate && formState.endDate < formState.startDate) {
      nextErrors.endDate = "Data final precisa ser maior ou igual a data inicial.";
    }

    if (REASON_REQUIRED_TYPES.includes(formState.type) && !formState.reason.trim()) {
      nextErrors.reason = "Motivo obrigatorio para este tipo de evento.";
    }

    return nextErrors;
  };

  const handleSave = () => {
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const now = new Date().toISOString();
    const employee = employees.find((item) => item.id === formState.employeeId);
    const sectorNameFromEmployee = employee?.sectorName?.trim() || "";
    const sectorName = formState.sectorName.trim() || sectorNameFromEmployee || "Nao informado";

    const nextEvent: HREventRecord = {
      id: initialEvent?.id ?? createEventId(),
      type: formState.type,
      employeeId: employee?.id ?? null,
      employeeName: employee?.name || "Nao informado",
      sectorId: employee?.sectorId ?? null,
      sectorName,
      startDate: formState.startDate,
      endDate: formState.endDate || null,
      reason: formState.reason.trim() || "Nao informado",
      notes: formState.notes.trim(),
      attachmentUrl: formState.attachmentUrl.trim() || null,
      createdAt: initialEvent?.createdAt ?? now,
    };

    onSave(nextEvent);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background">
        <DialogHeader>
          <DialogTitle>{initialEvent ? "Editar evento de RH" : "Novo evento de RH"}</DialogTitle>
          <DialogDescription>
            Registre ocorrencias de pessoas para manter o historico oficial da area de RH.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de evento</Label>
              <Select
                value={formState.type}
                onValueChange={(value) => setFormState((current) => ({ ...current, type: value as RHEventType }))}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {RH_EVENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Buscar colaborador</Label>
              <Input
                value={formState.employeeSearch}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    employeeSearch: event.target.value,
                  }))
                }
                placeholder="Digite para filtrar nomes"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select
                value={formState.employeeId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setFormState((current) => ({
                      ...current,
                      employeeId: "",
                    }));
                    return;
                  }

                  const employee = employees.find((item) => item.id === value);
                  setFormState((current) => ({
                    ...current,
                    employeeId: value,
                    sectorName: employee?.sectorName?.trim() || current.sectorName,
                  }));
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[240px]">
                  <SelectItem value="none">Nao vincular colaborador</SelectItem>
                  {filteredEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Setor</Label>
              <Select
                value={formState.sectorName || "none"}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    sectorName: value === "none" ? "" : value,
                  }))
                }
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-[240px]">
                  <SelectItem value="none">Sem setor</SelectItem>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data inicial</Label>
              <Input
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
              />
              {errors.startDate ? <p className="text-xs text-destructive">{errors.startDate}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Data final</Label>
              <Input
                type="date"
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    endDate: event.target.value,
                  }))
                }
              />
              {errors.endDate ? <p className="text-xs text-destructive">{errors.endDate}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input
              value={formState.reason}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  reason: event.target.value,
                }))
              }
              placeholder="Ex: Atestado de 7 dias, pedido de desligamento..."
            />
            {errors.reason ? <p className="text-xs text-destructive">{errors.reason}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Observacao</Label>
            <Textarea
              value={formState.notes}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              placeholder="Detalhes adicionais para auditoria e consulta futura."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexo (URL opcional)</Label>
            <Input
              value={formState.attachmentUrl}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  attachmentUrl: event.target.value,
                }))
              }
              placeholder="https://..."
            />
          </div>

          <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            TODO: persistir os eventos de RH em uma tabela dedicada no backend para trilha de auditoria.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              {initialEvent ? "Salvar alteracoes" : "Cadastrar evento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
