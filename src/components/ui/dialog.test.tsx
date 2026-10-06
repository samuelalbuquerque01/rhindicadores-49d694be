import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

it("keeps shared dialogs within mobile viewports and gives the close control an accessible name", () => {
  render(
    <Dialog open>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle>Diálogo de teste</DialogTitle>
      </DialogContent>
    </Dialog>,
  );

  expect(screen.getByRole("dialog")).toHaveClass(
    "w-[calc(100vw-1.5rem)]",
    "max-h-[calc(100dvh-1.5rem)]",
    "overflow-y-auto",
  );
  expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
});