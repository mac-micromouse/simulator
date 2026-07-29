#include <emscripten.h>
#include <stdint.h>

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1

EM_JS(void, pinMode, (uint8_t pin, uint8_t mode), {
	if (!Module.pins) {
		Module.pins = {};
	}

	Module.pins[pin] = { mode: mode, value: 0 };
});

EM_JS(void, digitalWrite, (uint8_t pin, uint8_t val), {
	if (Module.pins && Module.pins[pin]) {
		Module.pins[pin].value = val;
		postMessage({ type: "PIN_WRITE", pin: pin, value: val });
	}
});

EM_JS(void, digitalRead, (uint8_t pin), {
	return (Module.pins && Module.pins[pin]) ? Module.pins[pin].value : 0;
});

EM_JS(void, ledcAttachPin, (uint8_t pin, uint8_t channel), {
	if (!Module.pwm) {
		Module.pwm = {};
	}

	Module.pwm[channel] = { pin: pin, duty: 0 };
});

EM_JS(void, ledcWrite, (uint8_t channel, uint32_t duty), {
	if (Module.pwm && Module.pwm[channel]) {
		Module.pwm[channel].duty = duty;
		postMessage({ type: "PWM_WRITE", channel: channel, duty: duty });
	}
});

EM_JS(uint16_t, _readToF, (int sensor_id), {
	return Module.tof ? Module.tof[sensor_id] : 8190;
});

class VL53L1X {
private:
	int _id;
public:
	enum DistanceMode { Short, Medium, Long };

	VL53L1X(int sim_id) : _id(sim_id) {}

	bool init() { return true; }
	void setTimeout(uint16_t timeout) {}
	bool setDistanceMode(DistanceMode mode) { return true; }
	void startContinuous(uint32_t period_ms) {}
	bool dataReady() { return true; }

	uint16_t read() {
		return _readToF(this->_id);
	}
};

void delay(int ms) {
    emscripten_sleep(ms);
}