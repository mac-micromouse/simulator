class Simulator {
	constructor(ctx) {
		this.ctx = ctx;
		this.maze = new Maze({
			width: 12,
			height: 12
		}, ctx);
		this.bot = new Bot(9, 9);

		this.botWorker = new Worker("../test/worker.js");

		this.botWorker.onmessage = (e) => {
			if (e.data.type === 'MOTOR') {
				if (e.data.left >= 100) {
					this.bot.x += Math.cos(this.bot.rotation);
					this.bot.y += Math.sin(this.bot.rotation);
				}
			}
		};
	}

	loop() {
		this.bot.update();
		this.render();

		this.botWorker.postMessage({
			type: 'UPDATE_SENSORS',
			distances: { 0: this.bot.sensors[0].getMeasurement() }
		});

		window.requestAnimationFrame(this.loop.bind(this));
	}

	render() {
		this.maze.render();
		this.bot.render(this.ctx);
	}
}