import { TemperatureSample } from "./temperature-sample";
import { describe, expect, test, mock } from "bun:test";

import { Temperature, type TemperatureType } from "./temperature";

import type { ThresholdMonitorConfig } from "./threshold-config";
import { Thermometer } from "./thermometer";
import { ThresholdMonitor } from "./threshold-monitor";
import type { CallbackFn } from "./threshold-monitor";

describe("monitor thresholds", () => {
  test("simple crossing threshold", () => {
    const within1Degreeof24C: ThresholdMonitorConfig = {
      id: "1",
      name: "hit target from either direction",
      description:
        "This monitor will notify whenever the temperature is within a degree of 24C but ignore fluctuations of 1 degree around the mid point",
      targetTemp: new Temperature(24, "celsius"),
      direction: "both",
      notificationMode: "all",
      hysteresis: {
        unit: "celsius",
        range: 1,
      },
    };

    const monitor = new ThresholdMonitor();
    const monitorID = monitor.addConfig(within1Degreeof24C);

    // use this to fail the test if the callback is not called
    const timeout = setTimeout(() => {
      expect("expected a notification", "should be unreachable").toBe(
        "failing"
      );
    }, 100);

    monitor.addCallback(monitorID, (config, sample) => {
      expect(sample.sample.toCelsius()).toBeLessThanOrEqual(
        24 + within1Degreeof24C.hysteresis.range
      );
      expect(sample.sample.toCelsius()).toBeGreaterThanOrEqual(
        24 - within1Degreeof24C.hysteresis.range
      );
      expect(sample.timestamp).toEqual(sample.timestamp);
      clearTimeout(timeout);
    });

    const sample1 = new TemperatureSample(
      new Temperature(22, "celsius"),
      Date.now()
    );
    const sample2 = new TemperatureSample(
      new Temperature(23.5, "celsius"),
      Date.now() + 1000
    );
    monitor.updateTemperature(sample1);
    monitor.updateTemperature(sample2);
  });

  test("only trigger monitor once", () => {
    const fallingOnceTestCase: ThresholdMonitorConfig = {
      id: "2",
      name: "falling-once",
      description:
        "This monitor will notify once when the temperature falls below 32F once",
      targetTemp: new Temperature(32, "fahrenheit"),
      direction: "falling",
      notificationMode: "once",
      hysteresis: {
        unit: "fahrenheit",
        range: 0.5,
      },
    };

    const monitor = new ThresholdMonitor();
    const monitorID = monitor.addConfig(fallingOnceTestCase);
    const mockCallbackFn = mock(() => {});
    monitor.addCallback(monitorID, mockCallbackFn as CallbackFn);

    // cross it twice
    const samples = createSamples([34, 32, 30, 32, 34, 32], "fahrenheit");
    samples.forEach((sample) => {
      monitor.updateTemperature(sample);
    });
    expect(mockCallbackFn).toHaveBeenCalledTimes(1);
  });

  test("hysteresis range of 0.5", () => {
    const hysteresisEdgeCaseOfExactValuesMatchingHysteresis: ThresholdMonitorConfig =
      {
        id: "3",
        name: "ignore-half-degree-fluctuation",
        description:
          "This monitor should trigger when we reach 0c but ignore fluctations of 0.5c around 0",
        targetTemp: new Temperature(0, "celsius"),
        direction: "both",
        notificationMode: "all",
        hysteresis: {
          unit: "celsius",
          range: 0.5,
        },
      };

    const monitor = new ThresholdMonitor();
    const monitorID = monitor.addConfig(
      hysteresisEdgeCaseOfExactValuesMatchingHysteresis
    );

    // register a mock we will count how many times it's invoked
    const mockCallbackFn = mock(() => {});
    monitor.addCallback(monitorID, mockCallbackFn as CallbackFn);

    // samples should trigger one the 4th sample, and the last sample
    // oscillations around 0 should not trigger the monitor
    const samples = createSamples(
      [1.5, 1, 0.5, 0, -0.5, 0, -0.5, 0, 0.5, 0, 1, 0],
      "celsius"
    );
    samples.forEach((sample) => {
      monitor.updateTemperature(sample);
    });
    expect(mockCallbackFn).toHaveBeenCalledTimes(2);
  });
});

/**
 * Helper to create Temperature Samples for testing
 * @param temps numbers we want to sample
 * @param unit celsius or fahrenheit
 * @returns
 */
function createSamples(temps: number[], unit: TemperatureType) {
  let start = Date.now();
  return temps.map((temp) => {
    const sample = new TemperatureSample(new Temperature(temp, unit), start);
    start += 1000;
    return sample;
  });
}
