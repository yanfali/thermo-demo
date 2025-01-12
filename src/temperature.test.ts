import { describe, expect, test } from "bun:test";
import { celsiusToFahrenheit, fahrenheitToCelsius, Temperature } from "./temperature";

const celsiusToFahrenheitTestCases: {
  value: number;
  expected: number;
}[] = [{
  value: 0,
  expected: 32,
},
{
  value: 10,
  expected: 50
},
{
  value: 20,
  expected: 68
},
{
  value: 23.9,
  expected: 75,
},
{
  value: 37,
  expected: 98.6
},
{
  value: 37.8,
  expected: 100
}
  ];

test("C to F", () => {
  celsiusToFahrenheitTestCases.forEach(({ value, expected }) => {
    // ieee floating point has rounding errors so use toBeCloseTo - limit to a single decimal point
    expect(celsiusToFahrenheit(value), `${value}C -> ${expected}F`).toBeCloseTo(expected, 1)
  });
});

test("F to C", () => {
  const fahrenheitToCelsiusTestCases = celsiusToFahrenheitTestCases.map(({ value, expected }) => ({
    value: expected,
    expected: value
  }));

  fahrenheitToCelsiusTestCases.forEach(({ value, expected }) => {
    expect(fahrenheitToCelsius(value), `${value}F -> ${expected}C`).toBeCloseTo(expected, 1)
  });
});

describe("Temperature class", () => {
  test("f to c", () => {
    const temp = new Temperature(100, 'fahrenheit');
    expect(temp.toCelsius()).toBeCloseTo(37.8, 1);
  });
  test("c to f", () => {
    const temp = new Temperature(37, 'celsius');
    expect(temp.toFahrenheit()).toBeCloseTo(98.6, 1);
  })
})
