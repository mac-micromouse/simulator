#include <emscripten.h>
#include <stdint.h>
#include <sstream>
#include <string>
#include <vector>

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2

#define IRAM_ATTR

#define RISING 0
#define FALLING 1
#define CHANGE 2

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

EM_JS(uint8_t, digitalRead, (uint8_t pin), {
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

EM_JS(unsigned long, millis, (), {
	return Module.millis;
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

EM_JS(void, _sendSerialMessage, (const char* str), {
	let endPtr = str;

	while (HEAPU8[endPtr] !== 0) {
		endPtr++;
	}

	const stringBytes = HEAPU8.subarray(str, endPtr);
	const decodedText = new TextDecoder("utf-8").decode(stringBytes);

	postMessage({ type: "SERIAL", text: decodedText });
});

class _MockSerial {
public:
	void begin(long baudRate) {}

	template <typename T>
	void print(T val) {
		std::ostringstream ss;
		ss << val;
		_sendSerialMessage(ss.str().c_str());
	}

	template <typename T>
	void println(T val) {
		std::ostringstream ss;
		ss << val << "\n";
		_sendSerialMessage(ss.str().c_str());
	}

	void println() {
		_sendSerialMessage("\n");
	}
};

static _MockSerial Serial;

struct _Interrupt {
	uint8_t pin;
	void (*ISR)(void);
	int mode;
};

std::vector<_Interrupt> _interrupts;

int8_t digitalPinToInterrupt(uint8_t pin) {
	return pin;
}

void attachInterrupt(uint8_t interrupt, void (*ISR)(void), int mode) {
	_interrupts.push_back({ interrupt, ISR, mode });
}

EM_JS(int, _getSignals_internal, (uint8_t* buffer_ptr, int max_signals), {
	if (!Module.encoderSignals) return 0;

	let count = 0;
	let ptr = buffer_ptr;

	while (Module.encoderSignals.length > 0 && count < max_signals) {
		let next = Module.encoderSignals.shift();
		HEAPU8[ptr++] = next[0];
		HEAPU8[ptr++] = next[1];
		count++;
	}

	return count;
});

std::vector<std::pair<uint8_t, uint8_t>> _getSignals() {
	const int MAX_SIGNALS = 64;
	std::vector<std::pair<uint8_t, uint8_t>> signals(MAX_SIGNALS);

	int signal_count = _getSignals_internal(reinterpret_cast<uint8_t*>(signals.data()), MAX_SIGNALS);
	signals.resize(signal_count);

	return signals;
}

void setup();
void loop();

void updateInterrupts() {
	auto signals = _getSignals();
	for (auto signal : signals) {
		for (_Interrupt& itr : _interrupts) {
			if (itr.pin == signal.first &&
				((itr.mode == CHANGE) ||
				(itr.mode == RISING && signal.second == 1) ||
				(itr.mode == FALLING && signal.second == 0))
			) {
				itr.ISR();
			}
		}
	}
}

int main() {
	setup();
	while (1) {
		updateInterrupts();
		loop();
		delay(1);
	}
	return 0;
}