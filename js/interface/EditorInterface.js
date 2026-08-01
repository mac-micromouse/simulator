class EditorInterface {
	constructor(container) {
		this.editor = ace.edit(container);
		this.editor.setTheme("ace/theme/one_dark");
		this.editor.setShowPrintMargin(false);
		this.editor.container.style.lineHeight = 1.4;
		this.editor.renderer.updateFontSize();
		this.editor.session.setMode("ace/mode/c_cpp");

		if (localStorage.getItem("editor-value")) {
			this.editor.setValue(localStorage.getItem("editor-value"), -1);
		}

		const saveButton = document.getElementById("save-button");

		this.saveTimeout = null;
		this.editor.session.on("change", () => {
			saveButton.children[0].classList.replace("fa-check", "fa-ellipsis");
			saveButton.title = "Saving...";
			saveButton.style.color = "rgb(204, 208, 214)";
			window.clearTimeout(this.saveTimeout);

			this.saveTimeout = window.setTimeout(() => {
				localStorage.setItem("editor-value", this.editor.getValue());
				saveButton.children[0].classList.replace("fa-ellipsis", "fa-check");
				saveButton.title = "Saved!";
				saveButton.style.color = "rgb(100, 230, 100)";
			}, 3000);
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
	}

	selectLeftTab(tab, button) {
		[...document.querySelectorAll(".left-tab")].forEach(item => item.style.display = "none");
		tab.style.display = "block";

		[...document.getElementById("container-left").querySelectorAll(".selected")]
			.forEach(elem => elem.classList.remove("selected"));

		button.classList.add("selected");
	}
}