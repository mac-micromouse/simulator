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

int lastEncoderValL = LOW, lastEncoderValR = LOW;
int leftTicks = 0, rightTicks = 0;

const float TICKS_PER_ROTATION = 59.5;

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

void updateEncoders() {
	int currentL = digitalRead(ENC_L_A);
	int currentR = digitalRead(ENC_R_A);

	if (currentL != lastEncoderValL && currentL == HIGH) {
		leftTicks++;
	}

	if (currentR != lastEncoderValR && currentR == HIGH) {
		rightTicks++;
	}

	lastEncoderValL = currentL;
	lastEncoderValR = currentR;
}

void turnRightDegrees(float degrees) {
	turnRight(255);
	int goalTick = rightTicks + degrees / 360.0 * TICKS_PER_ROTATION;
	while (rightTicks < goalTick) {
		delay(5);
		updateEncoders();
	}
	stop();
}

void turnLeftDegrees(float degrees) {
	turnLeft(255);
	int goalTick = leftTicks + degrees / 360.0 * TICKS_PER_ROTATION;
	while (leftTicks < goalTick) {
		delay(5);
		updateEncoders();
	}
	stop();
}

void loop() {
	updateEncoders();
	uint16_t frontDist = frontToF.read();
	uint16_t leftDist = leftToF.read();
	uint16_t rightDist = rightToF.read();

	if (frontDist > 150) {}
	else if (rightDist > 180) {
		turnRightDegrees(90);
	} else if (leftDist > 180) {
		turnLeftDegrees(90);
	} else {
		while (frontDist <= 180) {
			turnRightDegrees(90);
			frontDist = frontToF.read();
		}
	}

	frontDist = frontToF.read();

	driveForward(150, 150);
	int turningMoratorium = 0;
	while (frontDist > 55) {
		turningMoratorium--;
		delay(30);
		frontDist = frontToF.read();
		leftDist = leftToF.read();
		rightDist = rightToF.read();

		if (leftDist < 150 && rightDist < 150) {
			if (leftDist < rightDist) {
				driveForward(150, 255);
			}

			if (rightDist < leftDist) {
				driveForward(255, 150);
			}
		} else {
			driveForward(255, 255);
		}
	}
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