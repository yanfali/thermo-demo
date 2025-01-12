export type TemperatureType = "celsius" | "fahrenheit";

/**
 * Convert Fahrenheit to Celsius.
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

/**
 * Convert Celsius to Fahrenheit
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Temperature is a value object which encapsulates temperatures
 * and their unit of measurement. This allows easy conversion between
 * different temperature units and is easily extensible in the future
 * to support different temperature units.
 */
export class Temperature {
  protected value: number;
  protected type: TemperatureType;

  constructor(value: number, type: TemperatureType) {
    this.value = value;
    this.type = type;
  }

  public toCelsius(): number {
    switch (this.type) {
      case "celsius":
        return this.value;
      case "fahrenheit":
        return fahrenheitToCelsius(this.value);
      default:
        // catch cases where we added new temp types in the future
        return NaN;
    }
  }

  public toFahrenheit(): number {
    switch (this.type) {
      case "celsius":
        return celsiusToFahrenheit(this.value);
      case "fahrenheit":
        return this.value;
      default:
        // catch cases where we added new temp types in the future
        return NaN;
    }
  }
}
