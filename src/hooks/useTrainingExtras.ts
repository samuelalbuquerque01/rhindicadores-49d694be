import { useEffect, useMemo, useState } from "react";
import {
  TRAININGS_EXTRA_EVENT,
  TrainingExtraData,
  readTrainingsExtra,
  readTrainingExtraById,
  upsertTrainingExtra,
} from "@/lib/storage/trainingsStorage";
import { LocalAttachment } from "@/lib/storage/eventsStorage";

export function useTrainingsExtra() {
  const [items, setItems] = useState<TrainingExtraData[]>(() => readTrainingsExtra());

  useEffect(() => {
    const sync = () => setItems(readTrainingsExtra());

    window.addEventListener("storage", sync);
    window.addEventListener(TRAININGS_EXTRA_EVENT, sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(TRAININGS_EXTRA_EVENT, sync);
    };
  }, []);

  const byTrainingId = useMemo(() => {
    return new Map(items.map((item) => [item.trainingId, item]));
  }, [items]);

  return {
    items,
    byTrainingId,
    refresh: () => setItems(readTrainingsExtra()),
    readById: (trainingId: string) => readTrainingExtraById(trainingId),
    save: (trainingId: string, payload: {
      tags: string[];
      attachments: LocalAttachment[];
      snapshot?: TrainingExtraData["snapshot"];
    }) =>
      upsertTrainingExtra(trainingId, payload),
  };
}
