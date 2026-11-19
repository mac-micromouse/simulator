class Interface {
	constructor(options) {
		this.mdConverter = new showdown.Converter();
		this.serial = new SerialInterface(document.getElementById("serial-interface-log"));
		this.editor = new EditorInterface(document.getElementById("code-editor"));
		this.options = new OptionsInterface(document.getElementById("options-container"), options);

		this.addListeners();
		this.createExamples();
		this.createDocumentation();
		this.initResizers();
	}

	addListeners() {
		const buttonRestart = document.getElementById("button-restart");
		const buttonCompile = document.getElementById("button-compile");
		const buttonMaze = document.getElementById("button-maze");
		const buttonClear = document.getElementById("button-clear");

		buttonCompile.addEventListener("click", async () => {
			if (buttonCompile.classList.contains("disabled")) {
				return;
			}

			if (buttonCompile.children[0].classList.contains("fa-stop")) {
				if (simulator.botWorker) {
					simulator.botWorker.terminate();
					simulator.stopped = true;
				}
				buttonCompile.children[0].classList.replace("fa-stop", "fa-play");
				return;
			}

			const files = this.editor.files;
			files[this.editor.currentFile].code = this.editor.editor.getValue();
			this.editor.saveImmediate();
			await simulator.compileAndDeploy(files);
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
		filePlusButton.addEventListener("click", () => {
			this.editor.addFile("untitled", "");
		});

		const projectPlusButton = document.getElementById("button-add-project");
		if (projectPlusButton) {
			projectPlusButton.addEventListener("click", () => {
				this.editor.addProject();
			});
		}

		const tabSimulation = document.getElementById("tab-simulation");
		const tabOptions = document.getElementById("tab-options");

		const simulationContainer = document.getElementById("simulation-container");
		const optionsContainer = document.getElementById("options-container");

		tabSimulation.addEventListener("click", () => this.selectRightTab(simulationContainer, tabSimulation));
		tabOptions.addEventListener("click", () => this.selectRightTab(optionsContainer, tabOptions));

		this.selectLeftTab(editorContainer, tabEditor);
		this.selectRightTab(simulationContainer, tabSimulation);

		window.addEventListener("keydown", event => {
			if (event.key.toLowerCase() === "s" && (event.ctrlKey || event.metaKey)) {
				event.preventDefault();
			}
		});
	}

	selectLeftTab(tab, button) {
		[...document.querySelectorAll(".left-tab")].forEach(item => item.style.display = "none");
		const flexTabs = ["editor-container", "documentation-container"];
		tab.style.display = flexTabs.includes(tab.id) ? "flex" : "block";

		[...document.getElementById("left-top").querySelectorAll(".selected")]
			.forEach(elem => elem.classList.remove("selected"));

		button.classList.add("selected");

		if (this.editor && tab.id === "editor-container") {
			this.editor.editor.resize();
		}
	}
	
	selectRightTab(tab, button) {
		[...document.querySelectorAll(".right-tab")].forEach(item => item.style.display = "none");
		tab.style.display = tab.id === "simulation-container" ? "flex" : "block";

		[...document.getElementById("right-top").querySelectorAll(".selected")]
			.forEach(elem => elem.classList.remove("selected"));

		button.classList.add("selected");
	}

	initResizers() {
		const projectsSidebar = document.getElementById("projects-sidebar");
		const resizerSidebar = document.getElementById("resizer-sidebar");
		const containerLeft = document.getElementById("container-left");
		const containerRight = document.getElementById("container-right");
		const resizerMain = document.getElementById("resizer-main");
		const canvas = document.querySelector("#simulation-container canvas");

		const MIN_SIDEBAR = 150;
		const MAX_SIDEBAR = 300;
		const MIN_CANVAS = 300;

		const getMaxCanvasSize = () => {
			return Math.max(MIN_CANVAS, Math.floor(window.innerHeight * 0.6));
		};

		this.setSimulationWidth = (desiredWidth) => {
			const maxCanvas = getMaxCanvasSize();
			const maxByWindow = Math.max(MIN_CANVAS, window.innerWidth - 320);
			const effectiveMax = Math.min(maxCanvas, maxByWindow);
			const clamped = Math.max(MIN_CANVAS, Math.min(effectiveMax, Math.round(desiredWidth)));

			if (containerRight) {
				containerRight.style.width = clamped + "px";
			}
			if (canvas) {
				canvas.style.width = clamped + "px";
				canvas.style.height = clamped + "px";
			}

			if (this.editor && this.editor.editor) {
				this.editor.editor.resize();
			}

			return clamped;
		};

		this.setSidebarWidth = (desiredWidth) => {
			const clamped = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, Math.round(desiredWidth)));
			if (projectsSidebar) {
				projectsSidebar.style.width = clamped + "px";
			}

			if (this.editor && this.editor.editor) {
				this.editor.editor.resize();
			}

			return clamped;
		};

		// Initial load from storage or default
		const savedSidebarWidth = parseFloat(localStorage.getItem("simulator-sidebar-width"));
		if (!isNaN(savedSidebarWidth)) {
			this.setSidebarWidth(savedSidebarWidth);
		} else {
			this.setSidebarWidth(190);
		}

		const savedRightWidth = parseFloat(localStorage.getItem("simulator-right-width"));
		const defaultRightWidth = Math.max(MIN_CANVAS, Math.min(604, getMaxCanvasSize()));
		if (!isNaN(savedRightWidth)) {
			this.setSimulationWidth(savedRightWidth);
		} else {
			this.setSimulationWidth(defaultRightWidth);
		}

		// Drag handler for sidebar resizer
		if (resizerSidebar && projectsSidebar) {
			let isDragging = false;
			let startX = 0;
			let startWidth = 0;

			resizerSidebar.addEventListener("pointerdown", (e) => {
				e.preventDefault();
				isDragging = true;
				startX = e.clientX;
				startWidth = projectsSidebar.getBoundingClientRect().width;
				resizerSidebar.setPointerCapture(e.pointerId);
				resizerSidebar.classList.add("resizing");
				document.body.style.cursor = "col-resize";
				document.body.style.userSelect = "none";
			});

			resizerSidebar.addEventListener("pointermove", (e) => {
				if (!isDragging) return;
				const delta = e.clientX - startX;
				this.setSidebarWidth(startWidth + delta);
			});

			const endSidebarDrag = (e) => {
				if (!isDragging) return;
				isDragging = false;
				try {
					resizerSidebar.releasePointerCapture(e.pointerId);
				} catch (_) {}
				resizerSidebar.classList.remove("resizing");
				document.body.style.cursor = "";
				document.body.style.userSelect = "";

				const finalWidth = projectsSidebar.getBoundingClientRect().width;
				localStorage.setItem("simulator-sidebar-width", finalWidth.toString());
				if (this.editor && this.editor.editor) {
					this.editor.editor.resize();
				}
			};

			resizerSidebar.addEventListener("pointerup", endSidebarDrag);
			resizerSidebar.addEventListener("pointercancel", endSidebarDrag);
		}

		// Drag handler for main simulation/serial resizer
		if (resizerMain && containerRight) {
			let isDragging = false;
			let startX = 0;
			let startWidth = 0;

			resizerMain.addEventListener("pointerdown", (e) => {
				e.preventDefault();
				isDragging = true;
				startX = e.clientX;
				startWidth = containerRight.getBoundingClientRect().width;
				resizerMain.setPointerCapture(e.pointerId);
				resizerMain.classList.add("resizing");
				document.body.style.cursor = "col-resize";
				document.body.style.userSelect = "none";
			});

			resizerMain.addEventListener("pointermove", (e) => {
				if (!isDragging) return;
				const delta = startX - e.clientX;
				this.setSimulationWidth(startWidth + delta);
			});

			const endMainDrag = (e) => {
				if (!isDragging) return;
				isDragging = false;
				try {
					resizerMain.releasePointerCapture(e.pointerId);
				} catch (_) {}
				resizerMain.classList.remove("resizing");
				document.body.style.cursor = "";
				document.body.style.userSelect = "";

				const finalWidth = containerRight.getBoundingClientRect().width;
				localStorage.setItem("simulator-right-width", finalWidth.toString());
				if (this.editor && this.editor.editor) {
					this.editor.editor.resize();
				}
			};

			resizerMain.addEventListener("pointerup", endMainDrag);
			resizerMain.addEventListener("pointercancel", endMainDrag);
		}

		window.addEventListener("resize", () => {
			if (containerRight) {
				const currentWidth = containerRight.getBoundingClientRect().width;
				this.setSimulationWidth(currentWidth);
			}
		});
	}

	async createExamples() {
		const examplesData = await (await fetch("cpp/examples.json")).json();
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
				this.editor.addProject(example.name, [{ name: "bot.cpp", code: exampleCode }]);
			});
		}
	}

	async createDocumentation() {
		const docsContent = document.getElementById("docs-content");
		const tocList = document.getElementById("docs-toc-list");
		const docsMd = await (await fetch("documentation/main.md")).text();

		docsContent.innerHTML = this.mdConverter.makeHtml(docsMd);
		hljs.highlightAll();

		// Build TOC from parsed headers
		const headers = docsContent.querySelectorAll("h1, h2, h3");
		headers.forEach((h, i) => {
			const id = "doc-heading-" + i;
			h.id = id;

			const item = document.createElement("div");
			item.classList.add("toc-item", "toc-" + h.tagName.toLowerCase());
			item.textContent = h.textContent;
			item.addEventListener("click", () => {
				docsContent.scrollTo({ top: h.offsetTop - 10, behavior: "smooth" });
			});
			tocList.appendChild(item);
		});
	}
}