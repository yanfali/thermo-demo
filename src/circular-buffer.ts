import { TemperatureSample } from "./temperature-sample";
import { Temperature } from "./temperature";

/**
 * A circular buffer that stores temperature samples.
 * This was planned to for a more sophisticated way
 * of decoupling the sampling rate of the source from the
 * rate at which we consume the data. But is currently not used.
 */
export class CircularTemperatureBuffer {
  private buffer: TemperatureSample[];
  private head: number = 0;
  private size: number = 0;

  constructor(private capacity: number) {
    this.buffer = new Array<TemperatureSample>(this.capacity);
  }

  push(temp: Temperature): TemperatureSample {
    const sample = new TemperatureSample(temp, Date.now());
    this.buffer[this.head] = sample;
    this.head = (this.head + 1) % this.capacity;
    this.size = Math.min(this.size + 1, this.capacity);
    return sample;
  }

  // Return all values in the buffer
  // this would be useful if we want to decouple the sampling
  // rate of the source from the rate at which we consume the data
  // we could filter by timestamp and use the most recent values
  // and average them.
  getValues(): TemperatureSample[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }

    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ];
  }

  getLatestValue(): TemperatureSample | null {
    if (this.size === 0) {
      return null;
    }

    return this.buffer[(this.head + this.capacity - 1) % this.capacity];
  }
}
