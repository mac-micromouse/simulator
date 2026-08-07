class SerialInterface {
	constructor(container) {
		this.container = container;
		this.clear();
	}

	postText(text) {
		const split = text.split("\n");

		for (let i = 0; i < split.length; i++) {
			if (i > 0) {
				const span = document.createElement("span");
				this.container.appendChild(span);
				this.currentSpan = span;
			}

			this.currentSpan.innerHTML += split[i].replaceAll(" ", "&nbsp;");
		}

		this.container.scrollTop = this.container.scrollHeight;

		while (this.container.children.length > 100) {
			this.container.firstElementChild.remove();
		}
	}

	clear() {
		this.container.innerHTML = `<span></span>`;
		this.currentSpan = this.container.querySelector("span");
	}
}