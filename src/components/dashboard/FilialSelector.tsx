import { useFiliais } from "@/hooks/useFiliais";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilialSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
}

export function FilialSelector({ value, onValueChange }: FilialSelectorProps) {
  const { data: filiais, isLoading } = useFiliais();

  return (
    <Select value={value || "all"} onValueChange={onValueChange}>
      <SelectTrigger className="w-full min-w-0 bg-background sm:w-[200px]">
        <SelectValue placeholder="Todas as filiais" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50">
        <SelectItem value="all">Todas as filiais</SelectItem>
        {isLoading ? (
          <SelectItem value="loading" disabled>
            Carregando...
          </SelectItem>
        ) : (
          filiais?.map((filial) => (
            <SelectItem key={filial.id} value={filial.id}>
              {filial.nome}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}
