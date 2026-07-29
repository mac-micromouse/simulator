const DIST_BETWEEN_WHEELS = 95;
const WHEEL_RADIUS = 22;
const MAX_SPEED = 15;
const ENCODER_TICKS_PER_REV = 360;
const MM_PER_TICK = (2 * Math.PI * WHEEL_RADIUS) / ENCODER_TICKS_PER_REV;

class Bot {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.rotation = 0;
		this.sensors = [
			new Sensor(this, 0, -3, 0),
			new Sensor(this, 0, 3, 0),
			new Sensor(this, -Math.PI / 2, 0, 0),
			new Sensor(this, Math.PI / 2, 0, 0)
		];
		this.pins = {};
		this.pwm = {};
		this.leftWheelDist = 0;
		this.rightWheelDist = 0;
	}

	update(currentTime) {
		const leftDir = this.getPin(16) - this.getPin(17);
		const rightDir = this.getPin(19) - this.getPin(21);

		const leftPWM = this.getPWM(0) / 255;
		const rightPWM = this.getPWM(1) / 255;

		const velLeft = leftDir * leftPWM * MAX_SPEED;
		const velRight = rightDir * rightPWM * MAX_SPEED;

		const dt = 60 / 1000;

		const distL = velLeft * dt;
		const distR = velRight * dt;
		const centerDist = (distL + distR) / 2;
		const deltaTheta = (distR - distL) / DIST_BETWEEN_WHEELS;

		this.rotation += deltaTheta;
		this.x += centerDist * Math.cos(this.rotation);
		this.y += centerDist * Math.sin(this.rotation);

		this.leftWheelDist += Math.abs(distL);
		this.rightWheelDist += Math.abs(distR);

		const encoderLeft = (Math.floor(this.leftWheelDist / MM_PER_TICK) % 2 === 0) ? 1 : 0;
		const encoderRight = (Math.floor(this.rightWheelDist / MM_PER_TICK) % 2 === 0) ? 1 : 0;

		simulator.botWorker.postMessage({
			type: "UPDATE",
			data: {
				tof: this.sensors.map(sensor => sensor.getMeasurement()),
				millis: Math.floor(currentTime),
				encoderLeft: encoderLeft,
				encoderRight: encoderRight
			}
		});
	}

	getPin(pinNumber) {
		return this.pins[pinNumber] || 0;
	}

	getPWM(channel) {
		return this.pwm[channel] || 0;
	}

	render(ctx) {
		ctx.save();
		ctx.translate(this.x * MAZE_GRID_SIZE / 18, this.y * MAZE_GRID_SIZE / 18);
		ctx.rotate(this.rotation);
		ctx.fillStyle = "#4b6ba3";
		ctx.fillRect(-15, -10, 30, 20);
		ctx.restore();
		this.sensors.forEach(sensor => sensor.render(ctx));
	}
}