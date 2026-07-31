class Simulator {
	constructor(ctx) {
		this.ctx = ctx;
		this.maze = new Maze({
			width: 12,
			height: 12
		}, ctx);
		this.bot = new Bot(9, 9);

		this.botWorker = new Worker("js/worker.js");

		this.botWorker.onmessage = (event) => {
			if (event.data.type === "PIN_WRITE") {
				this.bot.pins[event.data.pin] = event.data.value;
			}

			if (event.data.type === "PWM_WRITE") {
				this.bot.pwm[event.data.channel] = event.data.duty;
			}

			if (event.data.type === "SERIAL") {
				this.interface.serial.postText(event.data.text);
			}
		};

		this.interface = new Interface();
	}

	loop(currentTime) {
		this.bot.update(currentTime);
		this.render();

		window.requestAnimationFrame(this.loop.bind(this));
	}

	render() {
		this.maze.render();
		this.bot.render(this.ctx);
	}
}