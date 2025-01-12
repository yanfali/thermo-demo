# thermometer

To install dependencies:

```bash
bun install
```

To run:

This is a basic demo of the thermometer using the terminal. It has 3 notifications, 2 which fire once and 1 which fires every time you cross 20C.

```bash
bun run index.ts
```

This project was created using `bun init` in bun v1.1.34. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

To run tests:

```bash
bun test
```

## Comments

I probably went a little overboard with this, and planned for
features ultimately I did not end up implementing.

I see the problem also shares a lot of characteristics with system
monitoring, so it was interesting to think about.

### Design

A Thermometer is composed of a TemperatureSource and a ThresholdMonitor.
It composes the two Classes and uses their services to implement a
thermometer with notifications.

TemperatureSources emit Temperature value objects which encapsulate
the units, either Celsius or Fahrenheit.  The thermometer stores
the Temperatures within TemperatureSamples which have an associated
timestamp.

Those get pushed into a circular buffer. By default we store 60
samples.  This is configurable. The current test source defaults
to 1Hz, so about 60 seconds of samples.

This feature isn't currently used, but it would allow sinks to run
at different speeds to sources, and you could do different
smoothing/averaging/sampling.

Due to time constraints we short cut the circular buffer and just
send the values directly to the ThresholdMonitor.  This triggers
iterating across the registered monitors which then attempt to match
the monitor configs.  If anything matches, it fires a notification
for the registered callbacks for that monitor.

The tricky part was dealing with hysteresis edge cases. The suggested
inputs would cause the monitors to either never fire, or fire too
often. I used LLMs to research the problem and come up with a solution.

The current design allows a single monitor to register more than 1
callback per monitor. Monitors that are configured to notify once
are removed once after they trigger.

There is little to no error handling, I leave that as an exercise
to the reader.
