#include "micromouse.h"

// left motor pins
const int IN1 = 16;
const int IN2 = 17;
const int ENA = 18;

// right motor pins
const int IN3 = 19;
const int IN4 = 21;
const int ENB = 22;

VL53L1X frontToF(0), leftToF(1), rightToF(2);

void setup() {
	pinMode(IN1, OUTPUT);
	pinMode(IN2, OUTPUT);
	pinMode(IN3, OUTPUT);
	pinMode(IN4, OUTPUT);

	ledcAttachPin(ENA, 0);
	ledcAttachPin(ENB, 1);
	
	frontToF.init();
	leftToF.init();
	rightToF.init();
}

void turnLeft(int speed) {
	digitalWrite(IN1, HIGH);
	digitalWrite(IN2, LOW);
	digitalWrite(IN3, LOW);
	digitalWrite(IN4, HIGH);

	ledcWrite(0, speed);
	ledcWrite(1, speed);
}

void loop() {
	turnLeft(50);
	int front = frontToF.read(), left = leftToF.read(), right = rightToF.read();
	Serial.println("Front: " + std::to_string(front)
	    + "  Left: " + std::to_string(left) + "  Right: " + std::to_string(right));
	delay(1000);
}

int main() {
	setup();
	while (true) {
		loop();
	}
	return 0;
}