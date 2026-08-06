const COMPILE_SERVER_URL = "https://compiler.macmouse.ca/compile";

const DEFAULT_OPTIONS = {
	"width": 9.5,
	"length": 10,
	"wheel_radius": 2.2,
	"in1": 16,
	"in2": 17,
	"ena": 18,
	"enc_l_a": 34,
	"in3": 19,
	"in4": 21,
	"enb": 22,
	"enc_r_a": 35
};

class Simulator {
	constructor(ctx) {
		this.loadOptions();
		this.ctx = ctx;
		this.maze = new Maze({
			width: 12,
			height: 12
		}, ctx);

		this.interface = new Interface(this.options);
		this.init();

		this.lastCompile = {
			js: null,
			wasm: null
		};
	}

	loadOptions() {
		this.options = DEFAULT_OPTIONS;

		if (!localStorage.getItem("simulator-options")) {
			localStorage.setItem("simulator-options", JSON.stringify(this.options));
			return;
		}

		const data = JSON.parse(localStorage.getItem("simulator-options"));
		for (const key in data) {
			this.options[key] = data[key];
		}
	}

	setOption(key, value) {
		this.options[key] = value;
		localStorage.setItem("simulator-options", JSON.stringify(this.options));
	}

	init() {
		if (this.botWorker) {
			this.botWorker.terminate();
		}

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

		this.interface.serial.postText("Initializing...\n");

		this.init();
		
		this.botWorker.postMessage({
			type: "INIT",
			js: data.js,
			wasmBase64: data.wasmBase64
		});

		this.interface.serial.postText("Done!\n\n");
		this.lastCompile = {
			js: data.js,
			wasm: data.wasmBase64
		};
	}

	restart() {
		this.interface.serial.postText("\nRestarting...\n\n");
		this.init();
		this.botWorker.postMessage({
			type: "INIT",
			js: this.lastCompile.js,
			wasmBase64: this.lastCompile.wasm
		});
	}

	generateAndRestart() {
		if (!this.lastCompile.js || !this.lastCompile.wasm) {
			return;
		}

		this.restart();
		this.interface.serial.postText("Regenerating maze...\n");

		this.maze = new Maze({
			width: 12,
			height: 12
		}, this.ctx);

		this.interface.serial.postText("Done!\n\n");
	}
}