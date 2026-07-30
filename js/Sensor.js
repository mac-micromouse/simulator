class Sensor {
	constructor(bot, angle, offsetX, offsetY) {
		this.bot = bot;
		this.angle = angle;
		this.offsetX = offsetX;
		this.offsetY = offsetY;
	}

	render(ctx) {
		ctx.save();
		ctx.strokeStyle = "red";
		ctx.setLineDash([5, 5]);
		ctx.lineWidth = 2;

		const intersection = this.getIntersectionPoint(simulator.maze);
		const [rx, ry] = this.getActualPosition();

		if (intersection) {
			ctx.beginPath();
			ctx.moveTo(rx * MAZE_GRID_SIZE / 18, ry * MAZE_GRID_SIZE / 18);
			ctx.lineTo(intersection.x * MAZE_GRID_SIZE / 18, intersection.y * MAZE_GRID_SIZE / 18);
			ctx.stroke();

			ctx.beginPath();
			ctx.fillStyle = "red";
			ctx.arc(intersection.x * MAZE_GRID_SIZE / 18, intersection.y * MAZE_GRID_SIZE / 18, 5, 0, Math.PI * 2);
			ctx.fill();
		}

		ctx.beginPath();
		ctx.fillStyle = "yellow";
		ctx.arc(rx * MAZE_GRID_SIZE / 18, ry * MAZE_GRID_SIZE / 18, 3, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();
	}

	getActualPosition() {
		const [rx, ry] = positionAfterRotation(this.offsetX, this.offsetY, this.bot.rotation);
		return [rx + this.bot.x, ry + this.bot.y];
	}

	getIntersectionPoint() {
		const allIntersections = [];
		const computeIntersection = (x, y, dx, dy) => {
			const rot = this.angle + this.bot.rotation;
			const [rx, ry] = this.getActualPosition();
			const intersection = intersectLines(
				rx, ry,
				rx + Math.cos(rot) * 10000, ry + Math.sin(rot) * 10000,
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

		if (!intersection) {
			return 8190;
		}

		return Math.round(Math.hypot(intersection.x - this.bot.x, intersection.y - this.bot.y) * 10);
	}
}