import {
  ThresholdMonitor,
  type ThresholdMonitorInterface,
} from "./threshold-monitor";
import { CircularTemperatureBuffer } from "./circular-buffer";
import type { TemperatureSource } from "./temperature-source";

/**
 * The thermometer is composed of a TemperatureSource
 * and a ThresholdMonitor. It is responsible for connecting
 * to the source and updating the monitor with new values.
 *
 * One adds monitors and callbacks to the ThresholdMonitor
 * and the thermometer will update the monitor with new values.
 */
export class Thermometer {
  private timer: NodeJS.Timer | null = null;
  private buffer: CircularTemperatureBuffer;

  constructor(
    readonly source: TemperatureSource,
    readonly monitor: ThresholdMonitorInterface,
    capacity: number = 60
  ) {
    this.buffer = new CircularTemperatureBuffer(capacity);
  }

  async connect() {
    await this.source.connect();
    // collect new values from the source based on it's sampling rate
    this.timer = setInterval(async () => {
      try {
        const temp = await this.source.getValue();
        const sample = this.buffer.push(temp);
        this.monitor.updateTemperature(sample);
      } catch {
        // this should be rate limited or disconnect the interval timer
        // after a certain threshold. Toy implementation
        console.error("Unable to get value from source");
      }
    }, 1000 / this.source.samplingRate);
  }

  async disconnect() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.source.disconnect();
  }

  getValues() {
    return this.buffer.getValues();
  }

  getCurrentValue() {
    return this.buffer.getLatestValue();
  }
}
