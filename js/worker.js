const ENCODER_LEFT_PIN = 34;
const ENCODER_RIGHT_PIN = 35;

self.Module = {
	tof: [8190, 8190, 8190],
	pins: {},
	pwm: {},
	millis: 0
};

function nativeUtf8ToString(ptr) {
	const memory = new Uint8Array(Module.HEAPU8.buffer);
	let endPtr = ptr;
	while (memory[endPtr] !== 0) {
		endPtr++;
	}
	
	const bufferSlice = memory.subarray(ptr, endPtr);
	return new TextDecoder("utf-8").decode(bufferSlice);
}

self.onmessage = (event) => {
	if (event.data.type === "INIT") {
		const { js, wasmBase64 } = event.data;

		const binaryString = atob(wasmBase64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}

		self.Module.wasmBinary = bytes.buffer;

		const blob = new Blob([js], { type: "application/javascript" });
		const blobUrl = URL.createObjectURL(blob);

		importScripts(blobUrl);
		URL.revokeObjectURL(blobUrl);
	}

	if (event.data.type === "UPDATE") {
		self.Module.millis = event.data.data.millis;
		self.Module.tof = event.data.data.tof;

		self.Module.pins[ENCODER_LEFT_PIN] = { value: event.data.data.encoderLeft };
		self.Module.pins[ENCODER_RIGHT_PIN] = { value: event.data.data.encoderRight };
	}
};