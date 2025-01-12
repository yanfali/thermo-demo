console.log("Thermometer Demo");
import { Thermometer } from "./src/thermometer";
import { ThresholdMonitor } from "./src/threshold-monitor";
import { TestTemperatureSource } from "./src/temperature-source";
import { Temperature } from "./src/temperature";

const source = new TestTemperatureSource(20, 10, 1);
const monitor = new ThresholdMonitor();

const thermometer = new Thermometer(source, monitor);

const callbackID = monitor.addConfig({
  id: "demo", // this will be overwritten
  direction: "rising",
  hysteresis: {
    unit: "celsius",
    range: 1,
  },
  notificationMode: "once",
  targetTemp: new Temperature(28, "celsius"),
  description: "within 1 degree of 28C",
});

monitor.addCallback(callbackID, (config, sample) => {
  console.log("Oh it's hot!", config.description, sample);
});

const callbackID2 = monitor.addConfig({
  id: "demo-2", // this will be overwritten
  direction: "both",
  hysteresis: {
    unit: "celsius",
    range: 1,
  },
  notificationMode: "all",
  targetTemp: new Temperature(20, "celsius"),
  description: "within 1 degree of 20C",
});

monitor.addCallback(callbackID2, (config, sample) => {
  console.log("That's pretty comfy", config.description, sample);
});

const callbackID3 = monitor.addConfig({
  id: "demo-3", // this will be overwritten
  direction: "falling",
  hysteresis: {
    unit: "celsius",
    range: 1,
  },
  notificationMode: "once",
  targetTemp: new Temperature(12, "celsius"),
  description: "oh it's cold",
});

monitor.addCallback(callbackID3, (config, sample) => {
  console.log("Brrr", config.description, sample);
});

thermometer.connect();

// first value will be undefined because we have no previous temp.
setInterval(() => {
  console.log(
    `${thermometer.getCurrentValue()?.sample.toCelsius().toFixed(1)}C`
  );
}, 1000 / thermometer.source.samplingRate);

while (true) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
}
