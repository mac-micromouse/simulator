const COMPILE_SERVER_URL = "https://compiler.macmouse.ca/compile";

class Simulator {
	constructor(ctx) {
		this.ctx = ctx;
		this.maze = new Maze({
			width: 12,
			height: 12
		}, ctx);

		this.interface = new Interface();
		this.init();
	}

	init() {
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

	async compileAndDeploy(code) {
		this.interface.serial.postText("\nSending code to server...\n");

		const response = await fetch(COMPILE_SERVER_URL, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({ code })
		});

		const data = await response.json();

		if (!response.ok) {
			this.interface.serial.postText(data.detail ? `Error: ${data.detail}\n\n` : "Error during compilation\n\n");
			return;
		}

		if (this.botWorker) {
			this.botWorker.terminate();
		}

		this.interface.serial.postText("Initializing...\n");

		this.init();
		
		this.botWorker.postMessage({
			type: "INIT",
			js: data.js,
			wasmBase64: data.wasmBase64
		});

		this.interface.serial.postText("Done!\n\n");
	}
}