class Simulator {
	constructor(ctx) {
		this.ctx = ctx;
		this.maze = new Maze({
			width: 12,
			height: 12
		}, ctx);
		this.bot = new Bot(9, 9);
		this.loop();
	}

	loop() {
		this.render();
		window.requestAnimationFrame(this.loop.bind(this));
	}

	render() {
		this.maze.render();
		this.bot.render(this.ctx);
	}
}