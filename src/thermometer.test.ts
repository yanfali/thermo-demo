import type { ThresholdMonitorInterface } from "./threshold-monitor";
import { expect, test } from "bun:test";
import { Thermometer } from "./thermometer";
import { TestTemperatureSource } from "./temperature-source";
import type { TemperatureSample } from "./temperature-sample";

// we just need a stand in for the monitor
class FakeThresholdMonitor implements ThresholdMonitorInterface {
  updateTemperature(sample: TemperatureSample) {
    // do nothing
  }
}

test("thermometer basic, integration source test", async () => {
  const source = new TestTemperatureSource(20, 5, 1, 10);
  const thermometer = new Thermometer(source, new FakeThresholdMonitor());
  expect(thermometer.getValues()).toHaveLength(0);
  await thermometer.connect();
  await new Promise((resolve) => setTimeout(resolve, 550));
  expect(
    thermometer.getValues().length,
    "should have received 5 events over 500ms"
  ).toBeGreaterThanOrEqual(5);
  await thermometer.disconnect();
});
