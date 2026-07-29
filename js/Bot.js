const DIST_BETWEEN_WHEELS = 70;
const WHEEL_RADIUS = 15;
const MAX_SPEED = 15;

class Bot {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.rotation = Math.PI / 2;
		this.sensors = [
			new Sensor(this, 0),
			new Sensor(this, -Math.PI / 2),
			new Sensor(this, Math.PI / 2)
		];
		this.pins = {};
		this.pwm = {};
	}

	update() {
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