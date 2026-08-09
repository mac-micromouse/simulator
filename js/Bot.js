const MAX_SPEED = 15;
const ENCODER_TICKS_PER_REV = 360;

class Bot {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.rotation = 0;
		this.sensors = [
			new Sensor(this, 0, 5, 0),
			new Sensor(this, -Math.PI / 2, 0, -3),
			new Sensor(this, Math.PI / 2, 0, 3)
		];
		this.pins = {};
		this.pwm = {};
		this.leftWheelDist = 0;
		this.rightWheelDist = 0;
		this.encoderLeft = 0;
		this.encoderRight = 0;
	}

	update(currentTime) {
		const leftDir = this.getPin(simulator.options["in1"]) - this.getPin(simulator.options["in2"]);
		const rightDir = this.getPin(simulator.options["in3"]) - this.getPin(simulator.options["in4"]);

		const leftPWM = this.getPWM(0) / 255;
		const rightPWM = this.getPWM(1) / 255;

		const velLeft = leftDir * leftPWM * MAX_SPEED;
		const velRight = rightDir * rightPWM * MAX_SPEED;

		const dt = 60 / 1000;

		const distL = velLeft * dt;
		const distR = velRight * dt;
		const centerDist = (distL + distR) / 2;
		const deltaTheta = (distR - distL) / (simulator.options["width"] * 10);
		const newRotation = this.rotation + deltaTheta;
		const newX = this.x + centerDist * Math.cos(newRotation), newY = this.y + centerDist * Math.sin(newRotation);

		if (this.notHittingWall(newX, newY, newRotation)) {
			this.x = newX;
			this.y = newY;
			this.rotation = newRotation;
		}

		const MM_PER_TICK = (2 * Math.PI * simulator.options["wheel_radius"] * 10) / ENCODER_TICKS_PER_REV;
		let prevEncoderLeft = Math.floor(this.leftWheelDist / MM_PER_TICK);
		let prevEncoderRight = Math.floor(this.rightWheelDist / MM_PER_TICK);

		this.leftWheelDist += Math.abs(distL);
		this.rightWheelDist += Math.abs(distR);

		const currentEncoderLeft = Math.floor(this.leftWheelDist / MM_PER_TICK);
		const currentEncoderRight = Math.floor(this.rightWheelDist / MM_PER_TICK);

		const encoderSignals = [];

		while (prevEncoderLeft++ < currentEncoderLeft) {
			encoderSignals.push([0, this.encoderLeft ? 0 : 1]);
			this.encoderLeft = this.encoderLeft ? 0 : 1;
		}

		while (prevEncoderRight++ < currentEncoderRight) {
			encoderSignals.push([1, this.encoderRight ? 0 : 1]);
			this.encoderRight = this.encoderRight ? 0 : 1;
		}

		simulator.botWorker.postMessage({
			type: "UPDATE",
			data: {
				tof: this.sensors.map(sensor => sensor.getMeasurement()),
				millis: Math.floor(currentTime),
				encoderLeft: this.encoderLeft,
				encoderRight: this.encoderRight,
				encoderSignals: encoderSignals
			}
		});
	}

	getTilePos() {
		return [Math.floor(this.x / 18), Math.floor(this.y / 18)];
	}

	getNearbyWallSegments() {
		const [tx, ty] = this.getTilePos();
		const walls = [];

		for (let x = Math.max(0, tx - 1); x <= Math.min(simulator.maze.width - 1, tx + 1); x++) {
			for (let y = Math.max(0, ty - 1); y <= Math.min(simulator.maze.height - 1, ty + 1); y++) {
				const tile = simulator.maze.nodes[x][y];

				if (tile.walls[0]) walls.push({ x: tile.x * 18, y: tile.y * 18, w: 18, h: 0, tx: tile.x, ty: tile.y, wn: 0 });
				if (tile.walls[1]) walls.push({ x: tile.x * 18 + 18, y: tile.y * 18, w: 0, h: 18, tx: tile.x, ty: tile.y, wn: 1 });
				if (tile.walls[2]) walls.push({ x: tile.x * 18, y: tile.y * 18 + 18, w: 18, h: 0, tx: tile.x, ty: tile.y, wn: 2 });
				if (tile.walls[3]) walls.push({ x: tile.x * 18, y: tile.y * 18, w: 0, h: 18, tx: tile.x, ty: tile.y, wn: 3 });
			}
		}

		return walls;
	}

	notHittingWall(x, y, rotation, ctx=null) {
		const width = simulator.options["width"], length = simulator.options["length"];
		const [tlX, tlY] = positionAfterRotation(length / 2, -width / 2, rotation);
		const [trX, trY] = positionAfterRotation(length / 2, width / 2, rotation);
		const [blX, blY] = positionAfterRotation(-length / 2, -width / 2, rotation);
		const [brX, brY] = positionAfterRotation(-length / 2, width / 2, rotation);

		const walls = this.getNearbyWallSegments();
		const botLines = [
			[tlX + this.x, tlY + this.y, trX + this.x, trY + this.y],
			[trX + this.x, trY + this.y, brX + this.x, brY + this.y],
			[blX + this.x, blY + this.y, brX + this.x, brY + this.y],
			[tlX + this.x, tlY + this.y, blX + this.x, blY + this.y]
		];

		for (const line of botLines) {
			for (const wall of walls) {
				if (intersectLines(...line, wall.x, wall.y, wall.x + wall.w, wall.y + wall.h)) {
					simulator.maze.nodes[wall.tx][wall.ty].highlightedWalls[wall.wn] = performance.now() + 1000;
					return false;
				}
			}
		}
		
		return true;
	}

	getPin(pinNumber) {
		return this.pins[pinNumber] || 0;
	}

	getPWM(channel) {
		return this.pwm[channel] || 0;
	}

	render(ctx) {
		const width = simulator.options["width"], length = simulator.options["length"];

		ctx.save();
		ctx.translate(this.x * MAZE_GRID_SIZE / 18, this.y * MAZE_GRID_SIZE / 18);
		ctx.rotate(this.rotation);
		ctx.fillStyle = "#4b6ba3";
		ctx.fillRect(
			-length * MAZE_GRID_SIZE / 18 / 2, -width * MAZE_GRID_SIZE / 18 / 2,
			length * MAZE_GRID_SIZE / 18, width * MAZE_GRID_SIZE / 18
		);
		ctx.restore();
		this.sensors.forEach(sensor => sensor.render(ctx));
		this.notHittingWall(this.x, this.y, this.rotation, ctx);
	}
}