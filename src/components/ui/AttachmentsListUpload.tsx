import { ChangeEvent, useState } from "react";
import { FileUp, Link2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LocalAttachment } from "@/lib/storage/eventsStorage";

interface AttachmentsListUploadProps {
  items: LocalAttachment[];
  onChange: (items: LocalAttachment[]) => void;
  createId: () => string;
  disabled?: boolean;
}

function buildAttachmentFromFile(file: File, id: string): LocalAttachment {
  return {
    id,
    name: file.name,
    url: URL.createObjectURL(file),
    uploadedAt: new Date().toISOString(),
  };
}

export function AttachmentsListUpload({
  items,
  onChange,
  createId,
  disabled = false,
}: AttachmentsListUploadProps) {
  const [urlDraft, setUrlDraft] = useState("");
  const [urlNameDraft, setUrlNameDraft] = useState("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || disabled) return;

    const next = [...items];
    for (const file of Array.from(files)) {
      next.push(buildAttachmentFromFile(file, createId()));
    }
    onChange(next);
    event.target.value = "";
  };

  const addUrlAttachment = () => {
    if (disabled) return;
    const url = urlDraft.trim();
    if (!url) return;

    const name = urlNameDraft.trim() || url.replace(/^https?:\/\//, "").slice(0, 60);
    const attachment: LocalAttachment = {
      id: createId(),
      name,
      url,
      uploadedAt: new Date().toISOString(),
    };

    onChange([...items, attachment]);
    setUrlDraft("");
    setUrlNameDraft("");
  };

  const removeAttachment = (attachmentId: string) => {
    if (disabled) return;
    const target = items.find((item) => item.id === attachmentId);
    if (target && target.url.startsWith("blob:")) {
      URL.revokeObjectURL(target.url);
    }
    onChange(items.filter((item) => item.id !== attachmentId));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-2">
          <Input
            placeholder="Cole a URL do anexo (opcional)"
            value={urlDraft}
            onChange={(event) => setUrlDraft(event.target.value)}
            disabled={disabled}
            className="bg-background"
          />
        </div>
        <Input
          placeholder="Nome do anexo"
          value={urlNameDraft}
          onChange={(event) => setUrlNameDraft(event.target.value)}
          disabled={disabled}
          className="bg-background"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={addUrlAttachment} disabled={disabled || !urlDraft.trim()}>
          <Link2 className="h-4 w-4 mr-2" />
          Adicionar URL
        </Button>
        <label className="inline-flex">
          <input type="file" className="hidden" onChange={handleFileChange} multiple disabled={disabled} />
          <span className="inline-flex items-center rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted">
            <FileUp className="h-4 w-4 mr-2" />
            Upload local
          </span>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Sem anexos. Fallback localStorage ativo.
          {" "}
          TODO: migrar anexos para storage/backend com URL assinada.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="rounded-md border p-2 flex items-center justify-between gap-2">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 text-sm text-primary hover:underline inline-flex items-center gap-2"
              >
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </a>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAttachment(item.id)}
                disabled={disabled}
                aria-label={`Remover anexo ${item.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
