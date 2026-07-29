#include "micromouse.h"

// left motor pins
const int IN1 = 16;
const int IN2 = 17;
const int ENA = 18;

// right motor pins
const int IN3 = 19;
const int IN4 = 21;
const int ENB = 22;

// encoders
const int ENC_L_A = 34;
const int ENC_R_A = 35;

VL53L1X frontToF(0), leftToF(1), rightToF(2);

void setup() {
	pinMode(IN1, OUTPUT);
	pinMode(IN2, OUTPUT);
	pinMode(IN3, OUTPUT);
	pinMode(IN4, OUTPUT);

	ledcAttachPin(ENA, 0);
	ledcAttachPin(ENB, 1);

	pinMode(ENC_L_A, INPUT);
	pinMode(ENC_R_A, INPUT);

	frontToF.init();
	leftToF.init();
	rightToF.init();
}

void driveForward(int speed) {
	digitalWrite(IN1, HIGH);
	digitalWrite(IN2, LOW);
	digitalWrite(IN3, HIGH);
	digitalWrite(IN4, LOW);

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
	driveForward(0);
}

void loop() {
	uint16_t frontDist = frontToF.read();
	uint16_t leftDist = leftToF.read();
	uint16_t rightDist = rightToF.read();

	if (frontDist > 150) {
		driveForward(255);
	} else if (rightDist > 100) {
		turnRight(255);
		delay(1000);
		stop();
	} else if (leftDist > 100) {
		turnLeft(255);
		delay(1000);
		stop();
	} else {
		while (frontDist <= 100) {
			turnRight(255);
			delay(1000);
			stop();
			frontDist = frontToF.read();
		}
	}

	Serial.print(frontDist);
	Serial.print(" ");
	Serial.print(leftDist);
	Serial.print(" ");
	Serial.print(rightDist);
	Serial.println();
	delay(335);
	stop();
	delay(100);
}

int main() {
	setup();
	while (true) {
		loop();
	}
	return 0;
}