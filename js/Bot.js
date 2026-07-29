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
	}

	render(ctx) {
		ctx.save();
		ctx.translate(this.x * MAZE_GRID_SIZE / 18, this.y * MAZE_GRID_SIZE / 18);
		ctx.rotate(this.rotation);
		ctx.fillStyle = "#4b6ba3";
		ctx.fillRect(-20, -10, 40, 20);

		this.sensors.forEach(sensor => sensor.render(ctx));
		ctx.restore();
	}
}