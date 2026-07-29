const MAZE_GRID_SIZE = 50;

class Maze {
	constructor(options, ctx) {
		this.ctx = ctx;
		this.width = options.width;
		this.height = options.height;
		this.nodes = [];
		this.construct();
	}

	construct(straightFactor=2) {
		this.nodes = [];

		for (let x = 0; x < this.width; x++) {
			this.nodes.push([]);
			for (let y = 0; y < this.height; y++) {
				const isGoal = Math.abs(x + 0.5 - this.width / 2) <= 0.5 && Math.abs(y + 0.5 - this.height / 2) <= 0.5;
				this.nodes[this.nodes.length - 1].push(new MazeNode(x, y, isGoal));
			}
		}

		const tl = this.nodes[Math.ceil(this.width / 2) - 1][Math.ceil(this.height / 2) - 1];
		const tr = this.nodes[Math.ceil(this.width / 2)][Math.ceil(this.height / 2) - 1];
		const bl = this.nodes[Math.ceil(this.width / 2) - 1][Math.ceil(this.height / 2)];
		const br = this.nodes[Math.ceil(this.width / 2)][Math.ceil(this.height / 2)];

		tl.walls[1] = 0;
		tl.walls[2] = 0;
		tr.walls[2] = 0;
		tr.walls[3] = 0;
		bl.walls[0] = 0;
		bl.walls[1] = 0;
		br.walls[0] = 0;
		br.walls[3] = 0;

		const visited = new Set([tl, tr, bl, br]);
		let current = tl;

		while (current) {
			const neighbours = current.getNeighbours(this);
			if (current.previous) {
				neighbours.sort((a, b) => {
					return 	(current.previous.getDirectionBetween(current) - current.getDirectionBetween(b)) -
							(current.previous.getDirectionBetween(current) - current.getDirectionBetween(a));
				});
			}

			const distanceFromOutside = Math.min(current.x, current.y, this.width - current.x - 1, this.height - current.y - 1);

			let nextCurrent = null;
			while (neighbours.length > 0) {
				const power = distanceFromOutside < 2 ? straightFactor * 20 : straightFactor;
				const neighbour = neighbours.splice(Math.floor(Math.pow(Math.random(), power) * neighbours.length), 1)[0];
				if (!visited.has(neighbour)) {
					nextCurrent = neighbour;
					visited.add(neighbour);
					neighbour.previous = current;
					break;
				}
			}

			current = nextCurrent || current.previous;
		}

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.nodes[x][y].removeWalls();
			}
		}

		let countRemoved = 0;
		while (countRemoved < 5) {
			countRemoved += this.randomlyRemoveWall() ? 1 : 0;
		}

		return this;
	}

	randomlyRemoveWall() {
		const r1 = Math.floor(Math.random() * this.width), r2 = Math.floor(Math.random() * this.height);
		if (r1 < 1 || r2 < 1 || r1 >= this.width - 1 || r2 >= this.height - 1) {
			return false;
		}
		const node = this.nodes[r1][r2];
		const chosenSide = Math.floor(Math.random() * 4);
		const others = node.getNeighbours(this)
			.filter(n => node.getDirectionBetween(n) === chosenSide);

		if (others.length === 0) {
			return false;
		}

		const oppositeDirs = [2, 3, 0, 1];
		if (node.walls[chosenSide] === 0) {
			return false;
		}
		node.walls[chosenSide] = 0;
		others[0].walls[oppositeDirs[chosenSide]] = 0;

		return true;
	}

	render() {
		this.ctx.canvas.width = this.width * MAZE_GRID_SIZE + 4;
		this.ctx.canvas.height = this.height * MAZE_GRID_SIZE + 4;

		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.nodes[x][y].render(this.ctx);
			}
		}
	}

	isInBounds(x, y) {
		return x >= 0 && y >= 0 && x <= this.width - 1 && y <= this.height - 1;
	}
}

class MazeNode {
	constructor(x, y, isGoal) {
		this.x = x;
		this.y = y;
		this.walls = [1, 1, 1, 1];
		this.previous = null;
		this.isGoal = isGoal;
	}

	getDirectionBetween(otherNode) {
		if (otherNode.y < this.y) return 0;
		if (otherNode.x > this.x) return 1;
		if (otherNode.y > this.y) return 2;
		if (otherNode.x < this.x) return 3;
	}

	getNeighbours(maze, wallsMatter = false) {
		const neighbours = [];
		if (maze.isInBounds(this.x - 1, this.y) && (!wallsMatter || !this.walls[3])) neighbours.push(maze.nodes[this.x - 1][this.y]);
		if (maze.isInBounds(this.x + 1, this.y) && (!wallsMatter || !this.walls[1])) neighbours.push(maze.nodes[this.x + 1][this.y]);
		if (maze.isInBounds(this.x, this.y - 1) && (!wallsMatter || !this.walls[0])) neighbours.push(maze.nodes[this.x][this.y - 1]);
		if (maze.isInBounds(this.x, this.y + 1) && (!wallsMatter || !this.walls[2])) neighbours.push(maze.nodes[this.x][this.y + 1]);
		return neighbours;
	}

	removeWalls() {
		if (!this.previous) return;

		if (this.previous.x < this.x) {
			this.walls[3] = 0;
			this.previous.walls[1] = 0;
		}

		if (this.previous.x > this.x) {
			this.walls[1] = 0;
			this.previous.walls[3] = 0;
		}

		if (this.previous.y < this.y) {
			this.walls[0] = 0;
			this.previous.walls[2] = 0;
		}

		if (this.previous.y > this.y) {
			this.walls[2] = 0;
			this.previous.walls[0] = 0;
		}
	}

	render(ctx) {
		if (this.isGoal || (this.x === 0 && this.y === 0)) {
			ctx.fillStyle = this.isGoal ? "#ffff88" : "#88ee88";
			ctx.fillRect(this.x * MAZE_GRID_SIZE, this.y * MAZE_GRID_SIZE, MAZE_GRID_SIZE, MAZE_GRID_SIZE);
		}

		const drawLine = (x1, y1, x2, y2) => {
			ctx.strokeStyle = "black";
			ctx.lineWidth = 4;
			ctx.beginPath();
			ctx.moveTo(this.x * MAZE_GRID_SIZE + x1 + 2, this.y * MAZE_GRID_SIZE + y1 + 2);
			ctx.lineTo(this.x * MAZE_GRID_SIZE + x2 + 2, this.y * MAZE_GRID_SIZE + y2 + 2);
			ctx.stroke();
		};

		if (this.walls[0]) drawLine(0, 0, MAZE_GRID_SIZE, 0);
		if (this.walls[1]) drawLine(MAZE_GRID_SIZE, 0, MAZE_GRID_SIZE, MAZE_GRID_SIZE);
		if (this.walls[2]) drawLine(0, MAZE_GRID_SIZE, MAZE_GRID_SIZE, MAZE_GRID_SIZE);
		if (this.walls[3]) drawLine(0, 0, 0, MAZE_GRID_SIZE);
	}
}