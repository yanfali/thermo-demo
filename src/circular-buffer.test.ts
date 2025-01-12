import { test, expect } from "bun:test";
import { CircularTemperatureBuffer } from "./circular-buffer";
import { Temperature } from "./temperature";

test("circularBuffer capacity of 1", () => {
  const buffer = new CircularTemperatureBuffer(1);
  expect(buffer.getValues(), "should be empty").toEqual([]);
  buffer.push(new Temperature(10, "celsius"));
  expect(buffer.getValues(), "expected 1 element").toHaveLength(1);
  expect(buffer.getValues()[0].sample.toCelsius(), "unexpected temp").toEqual(
    10
  );

  buffer.push(new Temperature(20, "celsius"));
  expect(buffer.getValues(), "unexpected size").toHaveLength(1);
  expect(
    buffer.getValues()[0].sample.toCelsius(),
    "expect new value to overwrite old one"
  ).toEqual(20);
});

test("circular buffer of capacity 2", () => {
  const buffer = new CircularTemperatureBuffer(2);
  expect(buffer.getValues(), "should start out with no elements").toHaveLength(
    0
  );

  buffer.push(new Temperature(15, "celsius"));
  buffer.push(new Temperature(25, "celsius"));
  expect(buffer.getValues(), "should now have 2 elements").toHaveLength(2);

  buffer.getValues().forEach((temp, index) => {
    expect(temp.sample.toCelsius(), "unexpected element").toEqual(
      [15, 25][index]
    );
  });
});
