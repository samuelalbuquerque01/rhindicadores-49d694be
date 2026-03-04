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
      message: `${item.employeeName} has a contract ending in ${item.daysLeft} day(s).`,
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
      message: `Vacation for ${item.employeeName} starts in ${item.daysLeft} day(s).`,
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
      message: `${item.employeeName} has ${item.certificates} medical certificates this month.`,
      date: isoDate,
      urgencyLabel: "This month",
      priority: item.certificates >= 4 ? "high" : "medium",
      targetTab: "absenteismo",
    });
  });

  data.absenteeismSectorIncrease.forEach((item, index) => {
    notifications.push({
      id: `abs-inc-${index}-${item.sector}`,
      type: "absenteeism",
      message: `${item.sector} absenteeism increased ${item.variation.toFixed(1)}% vs previous period.`,
      date: isoDate,
      urgencyLabel: "Period comparison",
      priority: toPriority(item.variation),
      targetTab: "absenteismo",
    });
  });

  data.turnoverSectorIncrease.forEach((item, index) => {
    notifications.push({
      id: `turn-inc-${index}-${item.sector}`,
      type: "turnover",
      message: `${item.sector} turnover increased ${item.variation.toFixed(1)}% vs previous period.`,
      date: isoDate,
      urgencyLabel: "Period comparison",
      priority: toPriority(item.variation),
      targetTab: "turnover",
    });
  });

  data.anomalies.forEach((item, index) => {
    notifications.push({
      id: `anomaly-${index}-${item.key}`,
      type: "anomaly",
      message: `Anomaly detected in ${item.label} with value ${item.value.toFixed(1)}.`,
      date: isoDate,
      urgencyLabel: "Anomaly",
      priority: item.score >= 2.5 ? "high" : "medium",
      targetTab: "geral",
    });
  });

  if (data.turnoverRiskHigh) {
    notifications.push({
      id: `forecast-turnover-${data.turnoverRiskHigh.sector}`,
      type: "forecast",
      message: `Forecast indicates high turnover risk in ${data.turnoverRiskHigh.sector} (${data.turnoverRiskHigh.projected.toFixed(1)} projected).`,
      date: isoDate,
      urgencyLabel: "3-month forecast",
      priority: "high",
      targetTab: "turnover",
    });
  }

  if (data.absenteeismRiskHigh) {
    notifications.push({
      id: `forecast-abs-${data.absenteeismRiskHigh.sector}`,
      type: "forecast",
      message: `Forecast indicates absenteeism risk in ${data.absenteeismRiskHigh.sector} (${data.absenteeismRiskHigh.projected.toFixed(1)} projected days).`,
      date: isoDate,
      urgencyLabel: "3-month forecast",
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
