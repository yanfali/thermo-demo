import { Temperature } from "./temperature";

export type ThresholdMonitorDirection = "rising" | "falling" | "both";

export type ThresholdNotificationMode = "once" | "all";

/**
 * Hysteresis is a range around the target temperature
 */
export interface Hysteresis {
  unit: "celsius" | "fahrenheit";
  range: number; // +/- range around targetTemp
}

/**
 * Configuration for a threshold monitor
 */
export interface ThresholdMonitorConfig {
  targetTemp: Temperature;
  direction: ThresholdMonitorDirection;

  notificationMode: ThresholdNotificationMode;

  hysteresis: Hysteresis;

  id: string;
  name?: string;
  description?: string;
}
