#pragma once
#include <emscripten.h>
#include <stdint.h>
#include <sstream>
#include <string>
#include <vector>
#include <utility>

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2

#define IRAM_ATTR

#define RISING 0
#define FALLING 1
#define CHANGE 2

extern "C" {
void pinMode(uint8_t pin, uint8_t mode);
void digitalWrite(uint8_t pin, uint8_t val);
uint8_t digitalRead(uint8_t pin);
void ledcAttachPin(uint8_t pin, uint8_t channel);
void ledcWrite(uint8_t channel, uint32_t duty);
unsigned long millis();

uint16_t _readToF(int sensor_id);
}

void delay(int ms);

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

extern "C" {
void placeWall(uint8_t cell_x, uint8_t cell_y, uint8_t dir);
void removeWall(uint8_t cell_x, uint8_t cell_y, uint8_t dir);

void _sendSerialMessage(const char* str);
}

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

extern std::vector<_Interrupt> _interrupts;

int8_t digitalPinToInterrupt(uint8_t pin);
void detachInterrupt(uint8_t interrupt);
void attachInterrupt(uint8_t interrupt, void (*ISR)(void), int mode);

extern "C" int _getSignals_internal(uint8_t* buffer_ptr, int max_signals);
std::vector<std::pair<uint8_t, uint8_t>> _getSignals();

void setup();
void loop();

void updateInterrupts();