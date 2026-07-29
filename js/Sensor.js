class Sensor {
	constructor(bot, angle) {
		this.bot = bot;
		this.angle = angle;
	}

	render(ctx) {
		ctx.strokeStyle = "red";
		ctx.setLineDash([5, 5]);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(Math.cos(this.angle) * 300, Math.sin(this.angle) * 300);
		ctx.stroke();
	}

	getIntersectionPoint() {
		
	}
}