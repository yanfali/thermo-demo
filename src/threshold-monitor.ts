import { randomUUID } from "crypto";
import type { Hysteresis, ThresholdMonitorConfig } from "./threshold-config";
import { TemperatureSample } from "./temperature-sample";

export type MonitorID = string;
export type ObserverID = string;
export type CallbackFn = (
  config: ThresholdMonitorConfig,
  sample: TemperatureSample
) => void;

export interface ThresholdMonitorInterface {
  updateTemperature(temperature: TemperatureSample): void;
}

/**
 * The threshold monitor is responsible for registering
 * thresholds configurations and their callbacks
 * and notifying the callbacks when the temperature
 * crosses the specified threshold.
 */
export class ThresholdMonitor implements ThresholdMonitorInterface {
  // registered monitor configs
  private monitorConfigs: ThresholdMonitorConfig[] = [];
  private observers: Map<MonitorID, Map<ObserverID, CallbackFn>> = new Map();

  // previous temperature keyed by monitor id
  private previousTemperature: Map<MonitorID, TemperatureSample> = new Map();

  // store state about if we were within the band for a particular monitor
  private withinBand: Map<MonitorID, boolean> = new Map();

  // register a monitor
  addConfig(config: ThresholdMonitorConfig): MonitorID {
    // assign id's overwrite ones that may be in the config
    config.id = randomUUID();
    this.monitorConfigs.push(config);
    this.withinBand.set(config.id, false);
    return config.id;
  }

  // unregister a monitor
  removeConfig(id: MonitorID): void {
    this.monitorConfigs = this.monitorConfigs.filter(
      (config) => config.id !== id
    );
  }

  // get all registered monitors
  getConfigs() {
    return this.monitorConfigs;
  }

  // register a callback for a monitor
  // this allows multiple consumers to listen to the same monitor
  // note: this is a toy implementation and does not handle
  // cleanup.
  addCallback(monitorId: MonitorID, callback: CallbackFn) {
    const observerID = randomUUID();
    if (!this.observers.has(monitorId)) {
      this.observers.set(monitorId, new Map());
    }
    this.observers.get(monitorId)?.set(observerID, callback);
    return observerID;
  }

  removeCallback(monitorId: MonitorID, observerId: ObserverID) {
    // ignore monitorId if it doesn't exist
    this.observers.get(monitorId)?.delete(observerId);
  }

  // notify all observers of a monitor
  notifyObservers(monitorId: MonitorID, sample: TemperatureSample) {
    const config = this.monitorConfigs.find(
      (config) => config.id === monitorId
    );
    if (!config) {
      // nothing to do if the monitor doesn't exist
      return;
    }

    const observers = this.observers.get(monitorId);
    if (!observers) {
      // nothing to do if there are no observers
      return;
    }

    observers.forEach((callback, callbackID) => {
      // we should add error handling here and consider removing the observer
      // if they repeatedly fail. Let's keep it simple for now and just log
      // errors and continue
      try {
        callback(config, sample);
        if (config.notificationMode === "once") {
          this.removeCallback(monitorId, callbackID);
        }
      } catch (e) {
        console.error(`threshold monitor`, `failed callback ${monitorId}`, e);
      }
    });
  }

  // update the monitor with a new temperature
  updateTemperature(currentTemperature: TemperatureSample) {
    this.monitorConfigs.forEach((config) => {
      const previousTemperature = this.previousTemperature.get(config.id);
      if (!previousTemperature) {
        this.previousTemperature.set(config.id, currentTemperature);
        // no previous temp so skip
        return;
      }

      // check if the temperature is within the hysteresis range
      // normalize everything to celsius to keep things simple
      const hysteresisC = hysteresisToCelsius(config.hysteresis);
      const previousTempC = previousTemperature.sample.toCelsius();
      const currentTempC = currentTemperature.sample.toCelsius();
      const targetTempC = config.targetTemp.toCelsius();

      const upperBound = targetTempC + hysteresisC;
      const lowerBound = targetTempC - hysteresisC;

      const wasOutside = !this.withinBand.get(config.id);
      const nowInside =
        currentTempC >= lowerBound && currentTempC <= upperBound;

      // Debugging
      /*
      console.log(
        "updating temps",
        config.id,
        "h",
        hysteresisC,
        "p",
        previousTempC,
        "c",
        currentTempC,
        "t",
        targetTempC,
        "wo",
        wasOutside,
        "ni",
        nowInside
      );

      console.log("falling", isFalling(previousTempC, currentTempC));
      console.log("rising", isRising(previousTempC, currentTempC));
      console.log("crossing", isCrossing(previousTempC, currentTempC));
      */

      // transitioned from outside the band to inside the band
      // fire a notification
      if (wasOutside && nowInside) {
        // console.log("within band", config.id);
        if (
          config.direction === "both" &&
          isCrossing(previousTempC, currentTempC)
        ) {
          this.notifyObservers(config.id, currentTemperature);
        } else if (
          config.direction === "rising" &&
          isRising(previousTempC, currentTempC)
        ) {
          this.notifyObservers(config.id, currentTemperature);
        } else if (
          config.direction === "falling" &&
          isFalling(previousTempC, currentTempC)
        ) {
          this.notifyObservers(config.id, currentTemperature);
        }
      }

      // track state for config
      this.withinBand.set(config.id, nowInside);
      this.previousTemperature.set(config.id, currentTemperature);
    });
  }
}

// helper function to convert hysteresis relative ranges to celsius
export function hysteresisToCelsius(hysteresis: Hysteresis): number {
  if (hysteresis.unit === "celsius") {
    return hysteresis.range;
  }
  return (5 / 9) * hysteresis.range;
}

function isRising(previousTempC: number, currentTempC: number): boolean {
  return previousTempC < currentTempC;
}

function isFalling(previousTempC: number, currentTempC: number): boolean {
  return previousTempC > currentTempC;
}

function isCrossing(previousTempC: number, currentTempC: number): boolean {
  return (
    isRising(previousTempC, currentTempC) ||
    isFalling(previousTempC, currentTempC)
  );
}
