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
			new Sensor(this, 0, 5, 0),
			new Sensor(this, -Math.PI / 2, 0, -3),
			new Sensor(this, Math.PI / 2, 0, 3)
		];
		this.pins = {};
		this.pwm = {};
		this.leftWheelDist = 0;
		this.rightWheelDist = 0;
		this.width = 9.5;
		this.length = 10;
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
		const newRotation = this.rotation + deltaTheta;
		const newX = this.x + centerDist * Math.cos(newRotation), newY = this.y + centerDist * Math.sin(newRotation);

		if (this.notHittingWall(newX, newY, newRotation)) {
			this.x = newX;
			this.y = newY;
			this.rotation = newRotation;
		}

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
		const [tlX, tlY] = positionAfterRotation(this.length / 2, -this.width / 2, rotation);
		const [trX, trY] = positionAfterRotation(this.length / 2, this.width / 2, rotation);
		const [blX, blY] = positionAfterRotation(-this.length / 2, -this.width / 2, rotation);
		const [brX, brY] = positionAfterRotation(-this.length / 2, this.width / 2, rotation);

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
		ctx.save();
		ctx.translate(this.x * MAZE_GRID_SIZE / 18, this.y * MAZE_GRID_SIZE / 18);
		ctx.rotate(this.rotation);
		ctx.fillStyle = "#4b6ba3";
		ctx.fillRect(
			-this.length * MAZE_GRID_SIZE / 18 / 2, -this.width * MAZE_GRID_SIZE / 18 / 2,
			this.length * MAZE_GRID_SIZE / 18, this.width * MAZE_GRID_SIZE / 18
		);
		ctx.restore();
		this.sensors.forEach(sensor => sensor.render(ctx));
		this.notHittingWall(this.x, this.y, this.rotation, ctx);
	}
}