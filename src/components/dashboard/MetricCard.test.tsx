import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MetricCard } from "./MetricCard";

it("names the icon-only metric help trigger independently from its tooltip", () => {
  render(
    <TooltipProvider>
      <MetricCard
        title="Indicador de teste"
        value="10"
        icon={<span aria-hidden="true" />}
        variationPercent={0}
        trend="stable"
        tooltip="Explicação do indicador"
      />
    </TooltipProvider>,
  );

  expect(screen.getByRole("button", { name: "Mais informações sobre Indicador de teste" })).toBeInTheDocument();
});