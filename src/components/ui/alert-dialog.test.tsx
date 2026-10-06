import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "./alert-dialog";

it("keeps confirmation dialogs within mobile viewports and scrollable", () => {
  render(
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
        <AlertDialogDescription>Descrição de teste</AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>,
  );

  expect(screen.getByRole("alertdialog")).toHaveClass(
    "w-[calc(100vw-1.5rem)]",
    "max-h-[calc(100dvh-1.5rem)]",
    "overflow-y-auto",
  );
});