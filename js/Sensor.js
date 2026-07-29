class Sensor {
	constructor(bot, angle) {
		this.bot = bot;
		this.angle = angle;
	}

	render(ctx) {
		ctx.save();
		ctx.strokeStyle = "red";
		ctx.setLineDash([5, 5]);
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(this.bot.x * MAZE_GRID_SIZE / 18, this.bot.y * MAZE_GRID_SIZE / 18);
		const intersection = this.getIntersectionPoint(simulator.maze);
		ctx.lineTo(intersection.x * MAZE_GRID_SIZE / 18, intersection.y * MAZE_GRID_SIZE / 18);
		ctx.stroke();

		ctx.beginPath();
		ctx.fillStyle = "red";
		ctx.arc(intersection.x * MAZE_GRID_SIZE / 18, intersection.y * MAZE_GRID_SIZE / 18, 5, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	getIntersectionPoint() {
		const allIntersections = [];
		const computeIntersection = (x, y, dx, dy) => {
			const rot = this.angle + this.bot.rotation;
			const intersection = intersectLines(
				this.bot.x, this.bot.y,
				this.bot.x + Math.cos(rot) * 10000, this.bot.y + Math.sin(rot) * 10000,
				x, y, x + dx, y + dy
			);

			if (intersection) {
				allIntersections.push(intersection);
			}
		};

		for (let x = 0; x < simulator.maze.width; x++) {
			for (let y = 0; y < simulator.maze.height; y++) {
				const tile = simulator.maze.nodes[x][y];

				if (tile.walls[0]) computeIntersection(tile.x * 18, tile.y * 18, 18, 0);
				if (tile.walls[1]) computeIntersection(tile.x * 18 + 18, tile.y * 18, 0, 18);
				if (tile.walls[2]) computeIntersection(tile.x * 18, tile.y * 18 + 18, 18, 0);
				if (tile.walls[3]) computeIntersection(tile.x * 18, tile.y * 18, 0, 18);
			}
		}

		if (allIntersections.length === 0) {
			return null;
		}

		allIntersections.sort((a, b) => {
			return Math.hypot(this.bot.x - a.x, this.bot.y - a.y) - Math.hypot(this.bot.x - b.x, this.bot.y - b.y);
		});

		return allIntersections[0];
	}

	getMeasurement() {
		const intersection = this.getIntersectionPoint();

		return Math.round(Math.hypot(intersection.x - this.bot.x, intersection.y - this.bot.y));
	}
}