#include "micromouse.h"

// left motor pins
const int IN1 = 16;
const int IN2 = 17;
const int ENA = 18;

// right motor pins
const int IN3 = 19;
const int IN4 = 21;
const int ENB = 22;

void setup() {
	pinMode(IN1, OUTPUT);
	pinMode(IN2, OUTPUT);
	pinMode(IN3, OUTPUT);
	pinMode(IN4, OUTPUT);

	ledcAttachPin(ENA, 0);
	ledcAttachPin(ENB, 1);
}

void driveForward(int speed1, int speed2) {
	digitalWrite(IN1, HIGH);
	digitalWrite(IN2, LOW);
	digitalWrite(IN3, HIGH);
	digitalWrite(IN4, LOW);

	ledcWrite(0, speed1);
	ledcWrite(1, speed2);
}

void driveBackward(int speed) {
	digitalWrite(IN1, LOW);
	digitalWrite(IN2, HIGH);
	digitalWrite(IN3, LOW);
	digitalWrite(IN4, HIGH);

	ledcWrite(0, speed);
	ledcWrite(1, speed);
}

void turnRight(int speed) {
	digitalWrite(IN1, LOW);
	digitalWrite(IN2, HIGH);
	digitalWrite(IN3, HIGH);
	digitalWrite(IN4, LOW);

	ledcWrite(0, speed);
	ledcWrite(1, speed);
}

void turnLeft(int speed) {
	digitalWrite(IN1, HIGH);
	digitalWrite(IN2, LOW);
	digitalWrite(IN3, LOW);
	digitalWrite(IN4, HIGH);

	ledcWrite(0, speed);
	ledcWrite(1, speed);
}

void stop() {
	driveForward(0, 0);
}

void loop() {
	turnRight(255);
	delay(2000);
	turnLeft(255);
	delay(2000);
}