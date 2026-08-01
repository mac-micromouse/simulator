class Interface {
	constructor() {
		this.serial = new SerialInterface(document.getElementById("serial-interface"));
		this.editor = new EditorInterface(document.getElementById("code-editor"));

		this.addListeners();
	}

	addListeners() {
		const buttonRestart = document.getElementById("button-restart");
		const buttonCompile = document.getElementById("button-compile");
		const buttonMaze = document.getElementById("button-maze");

		buttonCompile.addEventListener("click", async () => {
			buttonCompile.classList.add("disabled");
			buttonCompile.children[0].classList.replace("fa-play", "fa-spinner");

			await simulator.compileAndDeploy(this.editor.editor.getValue());

			buttonCompile.classList.remove("disabled");
			buttonCompile.children[0].classList.replace("fa-spinner", "fa-play");
		});

		buttonMaze.addEventListener("click", () => {
			simulator.generateAndRestart();
		});

		buttonRestart.addEventListener("click", () => {
			simulator.restart();
		});
	}
}