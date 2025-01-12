import { expect, test } from "bun:test";
import { TestTemperatureSource } from "./temperature-source";

test("read 1 values from test source", async () => {
  const source = new TestTemperatureSource(20, 5, 1);
  expect(source.isConnected).toBe(false);
  source.connect();
  expect(source.isConnected, "verify state of source").toBe(true);
  expect(source.samplingRate).toBe(1);
  const value = await source.getValue();
  expect(value.toCelsius()).toBeGreaterThan(15);
  expect(value.toCelsius()).toBeLessThan(25);
});

test("read 20 values from test source @ 20Hz", async () => {
  const sampleRate = 20;
  const source = new TestTemperatureSource(25, 5, 1, sampleRate);
  expect(source.samplingRate).toBe(sampleRate);
  source.connect();
  try {
    let previous = await source.getValue();
    for (let i = 0; i < 20; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000 / sampleRate));
      const value = await source.getValue();
      expect(value.toCelsius()).toBeGreaterThan(20);
      expect(value.toCelsius()).toBeLessThan(30);
      expect(
        value.toFahrenheit() !== previous.toFahrenheit(),
        "every read should be different"
      ).toBe(true);
      previous = value;
    }
  } finally {
    source.disconnect();
  }
});
