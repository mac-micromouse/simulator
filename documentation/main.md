# Documentation

This documentation outlines the C++/ESP32 functions available in the simulator.
We've made an attempt to make the functions as realistic as possible; however,
there are still some differences between the simulator and an actual ESP32.

## Digital I/O

<div class="section">
```cpp
void pinMode(uint8_t pin, uint8_t mode)
```

Initializes a pin's state. Mode can either be INPUT or OUTPUT.

```cpp
void digitalWrite(uint8_t, uint8_t val)
```

Sets the digital value of a pin. Value can either be LOW or HIGH.

```cpp
uint8_t digitalRead(uint8_t pin)
```

Reads the current digital value of a pin.
</div>

## PWM (Pulse-Width Modulation)

<div class="section">
```cpp
void ledcAttachPin(uint8_t pin, uint8_t channel)
```

Assigns a PWM channel to a specific hardware pin.

```cpp
void ledcWrite(uint8_t channel, uint32_t duty)
```

Sets the duty cycle for the specified PWM channel.
</div>

## Time and Delay

<div class="section">
```cpp
unsigned long millis()
```

Returns the number of milliseconds since the simulator started.

```cpp
void delay(int ms)
```

Pauses execution for a specified number of milliseconds.
</div>

## Sensors: VL53L1X Time-of-Flight

<div class="section">
```cpp
VL53L1X(int sim_id)
```

Constructor for the mock sensor class. Takes a `sim_id`, mapping the C++ object to the virtual sensor.

```cpp
uint16_t read()
```

Returns the current distance reading in millimeters.

```cpp
bool init()
void setTimeout(uint16_t timeout)
bool setDistanceMode(DistanceMode mode)
void startContinuous(uint32_t period_ms)
bool dataReady()
```

Methods included for compatibility. These functions have no effect in the simulator.
</div>

## Serial Communication

<div class="section">
```cpp
Serial.begin(long baudRate)
```

Included for compatibility. Has no effect.

```cpp
Serial.print(T val)
```

Converts a type `T` into a string and sends it. Does not append a newline.

```cpp
Serial.println(T val)
```

Same as `print`, but appends a newline to the end of the string.

```cpp
Serial.println()
```

Sends an empty newline.
</div>