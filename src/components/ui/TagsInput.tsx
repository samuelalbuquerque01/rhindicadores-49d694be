import { KeyboardEvent, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
  suggestions?: string[];
  className?: string;
}

function normalizeTag(tag: string): string {
  return tag.trim().replace(/\s+/g, " ");
}

export function TagsInput({
  value,
  onChange,
  placeholder = "Digite uma tag e pressione Enter",
  disabled = false,
  maxTags = 12,
  suggestions = [],
  className,
}: TagsInputProps) {
  const [draft, setDraft] = useState("");

  const normalized = useMemo(() => value.map((tag) => normalizeTag(tag)).filter(Boolean), [value]);

  const availableSuggestions = useMemo(() => {
    return suggestions.filter((item) => !normalized.includes(item));
  }, [normalized, suggestions]);

  const addTag = (rawTag: string) => {
    if (disabled) return;
    const tag = normalizeTag(rawTag);
    if (!tag) return;
    if (normalized.includes(tag)) {
      setDraft("");
      return;
    }
    if (normalized.length >= maxTags) return;

    onChange([...normalized, tag]);
    setDraft("");
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(normalized.filter((tag) => tag !== tagToRemove));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    }
    if (event.key === "Backspace" && !draft && normalized.length > 0) {
      removeTag(normalized[normalized.length - 1]);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="bg-background"
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => addTag(draft)}
          disabled={disabled || !draft.trim() || normalized.length >= maxTags}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {normalized.length > 0 ? (
          normalized.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              {!disabled ? (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="rounded-full hover:bg-black/10"
                  aria-label={`Remover tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </Badge>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">Sem tags cadastradas.</p>
        )}
      </div>

      {availableSuggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {availableSuggestions.slice(0, 8).map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addTag(suggestion)}
              disabled={disabled}
              className="h-7 text-xs"
            >
              + {suggestion}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
