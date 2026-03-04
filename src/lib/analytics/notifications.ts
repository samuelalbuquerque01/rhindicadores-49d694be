import type { AnomalyPoint } from "@/lib/analytics/anomaly";

export type NotificationPriority = "high" | "medium" | "low";
export type NotificationType =
  | "contract"
  | "vacation"
  | "medical"
  | "absenteeism"
  | "turnover"
  | "anomaly"
  | "forecast";

export interface SmartNotification {
  id: string;
  type: NotificationType;
  message: string;
  date: string;
  urgencyLabel: string;
  priority: NotificationPriority;
  targetTab: "geral" | "absenteismo" | "turnover" | "timeline";
}

interface InputData {
  contractsEndingSoon: Array<{ employeeName: string; daysLeft: number }>;
  vacationsSoon: Array<{ employeeName: string; daysLeft: number }>;
  medicalCertificates: Array<{ employeeName: string; certificates: number }>;
  absenteeismSectorIncrease: Array<{ sector: string; variation: number }>;
  turnoverSectorIncrease: Array<{ sector: string; variation: number }>;
  anomalies: AnomalyPoint[];
  turnoverRiskHigh?: { sector: string; projected: number };
  absenteeismRiskHigh?: { sector: string; projected: number };
  now?: Date;
}

function toPriority(variation: number): NotificationPriority {
  if (variation >= 25) return "high";
  if (variation >= 10) return "medium";
  return "low";
}

export function generateSmartNotifications(data: InputData): SmartNotification[] {
  const now = data.now ?? new Date();
  const isoDate = now.toISOString();

  const notifications: SmartNotification[] = [];

  data.contractsEndingSoon.forEach((item, index) => {
    notifications.push({
      id: `contract-${index}-${item.employeeName}`,
      type: "contract",
      message: `${item.employeeName} tem contrato encerrando em ${item.daysLeft} dia(s).`,
      date: isoDate,
      urgencyLabel: `D-${item.daysLeft}`,
      priority: item.daysLeft <= 7 ? "high" : "medium",
      targetTab: "timeline",
    });
  });

  data.vacationsSoon.forEach((item, index) => {
    notifications.push({
      id: `vac-${index}-${item.employeeName}`,
      type: "vacation",
      message: `Ferias de ${item.employeeName} com inicio em ${item.daysLeft} dia(s).`,
      date: isoDate,
      urgencyLabel: `D-${item.daysLeft}`,
      priority: item.daysLeft <= 7 ? "high" : "low",
      targetTab: "absenteismo",
    });
  });

  data.medicalCertificates.forEach((item, index) => {
    notifications.push({
      id: `medical-${index}-${item.employeeName}`,
      type: "medical",
      message: `${item.employeeName} possui ${item.certificates} atestados medicos no mes.`,
      date: isoDate,
      urgencyLabel: "Mes atual",
      priority: item.certificates >= 4 ? "high" : "medium",
      targetTab: "absenteismo",
    });
  });

  data.absenteeismSectorIncrease.forEach((item, index) => {
    notifications.push({
      id: `abs-inc-${index}-${item.sector}`,
      type: "absenteeism",
      message: `${item.sector} aumentou o absenteismo em ${item.variation.toFixed(1)}% vs periodo anterior.`,
      date: isoDate,
      urgencyLabel: "Comparacao de periodo",
      priority: toPriority(item.variation),
      targetTab: "absenteismo",
    });
  });

  data.turnoverSectorIncrease.forEach((item, index) => {
    notifications.push({
      id: `turn-inc-${index}-${item.sector}`,
      type: "turnover",
      message: `${item.sector} aumentou o turnover em ${item.variation.toFixed(1)}% vs periodo anterior.`,
      date: isoDate,
      urgencyLabel: "Comparacao de periodo",
      priority: toPriority(item.variation),
      targetTab: "turnover",
    });
  });

  data.anomalies.forEach((item, index) => {
    notifications.push({
      id: `anomaly-${index}-${item.key}`,
      type: "anomaly",
      message: `Anomalia detectada em ${item.label} com valor ${item.value.toFixed(1)}.`,
      date: isoDate,
      urgencyLabel: "Anomalia",
      priority: item.score >= 2.5 ? "high" : "medium",
      targetTab: "geral",
    });
  });

  if (data.turnoverRiskHigh) {
    notifications.push({
      id: `forecast-turnover-${data.turnoverRiskHigh.sector}`,
      type: "forecast",
      message: `Previsao indica alto risco de turnover em ${data.turnoverRiskHigh.sector} (${data.turnoverRiskHigh.projected.toFixed(1)} projetado).`,
      date: isoDate,
      urgencyLabel: "Previsao 3 meses",
      priority: "high",
      targetTab: "turnover",
    });
  }

  if (data.absenteeismRiskHigh) {
    notifications.push({
      id: `forecast-abs-${data.absenteeismRiskHigh.sector}`,
      type: "forecast",
      message: `Previsao indica risco de absenteismo em ${data.absenteeismRiskHigh.sector} (${data.absenteeismRiskHigh.projected.toFixed(1)} dias projetados).`,
      date: isoDate,
      urgencyLabel: "Previsao 3 meses",
      priority: "high",
      targetTab: "absenteismo",
    });
  }

  return notifications
    .sort((a, b) => {
      const weight: Record<NotificationPriority, number> = {
        high: 3,
        medium: 2,
        low: 1,
      };
      return weight[b.priority] - weight[a.priority];
    })
    .slice(0, 20);
}
