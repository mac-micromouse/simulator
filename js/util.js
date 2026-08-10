// https://stackoverflow.com/questions/13937782/calculating-the-point-of-intersection-of-two-lines
function intersectLines(x1, y1, x2, y2, x3, y3, x4, y4) {
	// Check if none of the lines are of length 0
	if ((x1 === x2 && y1 === y2) || (x3 === x4 && y3 === y4)) {
		return false;
	}

	denominator = ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

	// Lines are parallel
	if (denominator === 0) {
		return false;
	}

	let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denominator;
	let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denominator;

	// is the intersection along the segments
	if (ua < 0 || ua > 1 || ub < 0 || ub > 1) {
		return false;
	}

	// Return a object with the x and y coordinates of the intersection
	let x = x1 + ua * (x2 - x1)
	let y = y1 + ua * (y2 - y1)

	return {x, y};
}

function positionAfterRotation(x, y, rotation) {
	return [
		x * Math.cos(rotation) - y * Math.sin(rotation),
		x * Math.sin(rotation) + y * Math.cos(rotation)
	];
}

function downloadFile(content, fileName, contentType) {
	const blob = new Blob([content], { type: contentType });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}