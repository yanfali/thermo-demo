import { Temperature, type TemperatureType } from "./temperature";

export type TemperatureSourceType = "test" | "file" | "hardware" | "network";

export class TempSourceError extends Error { }

/**
 * TemperatureSource is an abstraction of how to get
 * temperature data from different sources like a file,
 * hardware, or the network.
 */
export interface TemperatureSource {
  // Core operations
  getValue(): Promise<Temperature>;

  readonly samplingRate: number; // Hz

  // Source metadata/status
  readonly sourceType: TemperatureSourceType;
  isConnected: boolean;

  // useful for hardware and network
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  // Event emitters
  onError(callback: (error: TempSourceError) => void): void;
  onDisconnect(callback: () => void): void;
}

/**
 * TestTemperatureSource is a fake temperature source that generates
 * a configurable sine wave of temperature values.
 */
export class TestTemperatureSource implements TemperatureSource {
  readonly samplingRate: number = 1; // in Hz
  readonly sourceType: TemperatureSourceType = "test";
  isConnected: boolean = false;
  protected errorCallback: (error: TempSourceError) => void = () => { };
  protected disconnectCallback: () => void = () => { };
  protected sourceData: () => number;
  protected currentValue: number = 0;
  protected timer: NodeJS.Timer | null = null;

  /**
   * @param midPoint {number} - The center value in Celsius
   * @param amplitude {number} - How far it deviates from the midpoint
   * @param frequency {number} - How many cycles per 2π steps (higher = faster oscillation)
   */
  constructor(
    midpoint: number,
    amplitude: number,
    frequency: number,
    sampleRate: number = 1,
    readonly format: TemperatureType = "celsius"
  ) {
    this.sourceData = generateSineWave(midpoint, amplitude, frequency);
    this.samplingRate = sampleRate;
  }

  async connect(): Promise<void> {
    this.currentValue = this.sourceData();
    this.timer = setInterval(() => {
      this.currentValue = this.sourceData();
    }, 1000 / this.samplingRate);
    this.isConnected = true;
    return;
  }

  async disconnect(): Promise<void> {
    this.disconnectCallback();
    if (this.timer) {
      clearInterval(this.timer);
    }
    return;
  }

  onError(callback: (error: TempSourceError) => void): void {
    this.errorCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.disconnectCallback = callback;
  }

  async getValue(): Promise<Temperature> {
    return new Temperature(this.currentValue, this.format);
  }
}

function generateSineWave(
  midPoint: number = 0,
  amplitude: number = 1,
  frequency: number = 1
) {
  let step = 0;

  return () => {
    const value = midPoint + amplitude * Math.sin(frequency * step);
    step += 0.1; // Controls how fast the wave progresses
    return value;
  };
}
