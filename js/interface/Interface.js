class Interface {
	constructor() {
		this.mdConverter = new showdown.Converter();
		this.serial = new SerialInterface(document.getElementById("serial-interface-log"));
		this.editor = new EditorInterface(document.getElementById("code-editor"));

		this.addListeners();
		this.createExamples();
		this.createDocumentation();
	}

	addListeners() {
		const buttonRestart = document.getElementById("button-restart");
		const buttonCompile = document.getElementById("button-compile");
		const buttonMaze = document.getElementById("button-maze");
		const buttonClear = document.getElementById("button-clear");

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

		buttonClear.addEventListener("click", () => {
			this.serial.clear();
		});

		const tabEditor = document.getElementById("tab-editor");
		const tabDocumentation = document.getElementById("tab-documentation");
		const tabExamples = document.getElementById("tab-examples");

		const editorContainer = document.getElementById("editor-container");
		const documentationContainer = document.getElementById("documentation-container");
		const examplesContainer = document.getElementById("examples-container");

		tabEditor.addEventListener("click", () => this.selectLeftTab(editorContainer, tabEditor));
		tabDocumentation.addEventListener("click", () => this.selectLeftTab(documentationContainer, tabDocumentation));
		tabExamples.addEventListener("click", () => this.selectLeftTab(examplesContainer, tabExamples));

		const filePlusButton = document.getElementById("button-add-file");
		filePlusButton.addEventListener("click", () => this.selectLeftTab(examplesContainer, tabExamples));

		const tabSimulation = document.getElementById("tab-simulation");
		const tabOptions = document.getElementById("tab-options");

		const simulationContainer = document.getElementById("simulation-container");
		const optionsContainer = document.getElementById("options-container");

		tabSimulation.addEventListener("click", () => this.selectRightTab(simulationContainer, tabSimulation));
		tabOptions.addEventListener("click", () => this.selectRightTab(optionsContainer, tabOptions));

		this.selectLeftTab(editorContainer, tabEditor);
		this.selectRightTab(simulationContainer, tabSimulation);
	}

	selectLeftTab(tab, button) {
		[...document.querySelectorAll(".left-tab")].forEach(item => item.style.display = "none");
		tab.style.display = "block";

		[...document.getElementById("left-top").querySelectorAll(".selected")]
			.forEach(elem => elem.classList.remove("selected"));

		button.classList.add("selected");
	}
	
	selectRightTab(tab, button) {
		[...document.querySelectorAll(".right-tab")].forEach(item => item.style.display = "none");
		tab.style.display = "block";

		[...document.getElementById("right-top").querySelectorAll(".selected")]
			.forEach(elem => elem.classList.remove("selected"));

		button.classList.add("selected");
	}

	async createExamples() {
		const examplesData = await (await fetch("/cpp/examples.json")).json();
		const editorContainer = document.getElementById("examples-listing");
		
		for (const example of examplesData) {
			const container = document.createElement("div");
			container.classList.add("example");
			container.innerHTML = `
				<div class="example-name">${example.name} <span class="badge-${example.complexity}">${example.complexity}</span></div>
				<div class="example-desc">${example.desc}</div>
				<div class="example-button"><span class="fa fa-plus"></span> Add to editor</div>
			`;
			editorContainer.appendChild(container);

			container.querySelector(".example-button").addEventListener("click", async () => {
				const editorContainer = document.getElementById("editor-container");
				const tabEditor = document.getElementById("tab-editor");
				this.selectLeftTab(editorContainer, tabEditor);

				const exampleCode = await (await fetch(example.path)).text();
				this.editor.addFile(example.saveAs, exampleCode);
			});
		}
	}

	async createDocumentation() {
		const documentationContainer = document.getElementById("documentation-container");
		const docsMd = await (await fetch("/documentation/main.md")).text();

		documentationContainer.innerHTML = this.mdConverter.makeHtml(docsMd);
		hljs.highlightAll();
	}
}