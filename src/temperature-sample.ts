import { Temperature } from "./temperature";

/**
 * A sample is a temperature at a moment in time.
 * It facilitates decoupling sources from sinks so they can both sample
 * at different rates.
 */
export class TemperatureSample {
  readonly sample: Temperature;
  readonly timestamp: number;

  constructor(value: Temperature, timestamp: number) {
    this.sample = value;
    this.timestamp = timestamp;
  }
}
