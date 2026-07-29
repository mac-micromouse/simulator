const ENCODER_LEFT_PIN = 34;
const ENCODER_RIGHT_PIN = 35;

self.Module = {
	tof: [8190, 8190, 8190],
	pins: {},
	pwm: {}
};

self.onmessage = (event) => {
	if (event.data.type === "UPDATE") {
		self.Module.tof = event.data.data.tof;

		self.Module.pins[ENCODER_LEFT_PIN] = { value: event.data.data.encoderLeft };
		self.Module.pins[ENCODER_RIGHT_PIN] = { value: event.data.data.encoderRight };
	}
};

importScripts('./wasm_bot.js');