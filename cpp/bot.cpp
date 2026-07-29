#include "micromouse.h"

VL53L1X frontToF(0), leftToF(1), rightToF(2);

void setup() {
}

void loop() {
	Serial.println(frontToF.read());
	delay(20);
}

int main() {
	setup();
	while (true) {
		loop();
	}
	return 0;
}