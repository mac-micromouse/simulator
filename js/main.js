let canvas, ctx, simulator;

window.addEventListener("load", init);

function init() {
	canvas = document.querySelector("canvas");
	ctx = canvas.getContext("2d");
	simulator = new Simulator(ctx);
	simulator.loop();
}