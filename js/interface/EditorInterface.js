class EditorInterface {
	constructor(container) {
		this.editor = ace.edit(container);
		this.editor.setTheme("ace/theme/one_dark");
		this.editor.setShowPrintMargin(false);
		this.editor.container.style.lineHeight = 1.4;
		this.editor.renderer.updateFontSize();
		this.editor.session.setMode("ace/mode/c_cpp");
		this.isChanging = false;

		this.files = [{
			name: "bot.cpp",
			code: `#include "micromouse.h"\n\nint main() {\n\tSerial.println("Hello world!");\n}`
		}];
		this.currentFile = 0;

		if (localStorage.getItem("editor-files")) {
			this.files = JSON.parse(localStorage.getItem("editor-files"));
			this.renderFileTabs();
		}

		this.editor.setValue(this.files[0].code, -1);

		const saveButton = document.getElementById("save-button");

		this.saveTimeout = null;
		this.editor.session.on("change", () => {
			if (this.isChanging) {
				return;
			}
			this.files[this.currentFile].code = this.editor.getValue();
			saveButton.children[0].classList.replace("fa-check", "fa-ellipsis");
			saveButton.title = "Saving...";
			saveButton.style.color = "rgb(204, 208, 214)";
			window.clearTimeout(this.saveTimeout);

			this.saveTimeout = window.setTimeout(() => {
				localStorage.setItem("editor-files", JSON.stringify(this.files));
				saveButton.children[0].classList.replace("fa-ellipsis", "fa-check");
				saveButton.title = "Saved!";
				saveButton.style.color = "rgb(100, 230, 100)";
			}, 3000);
		});
	}

	renderFileTabs() {
		const filesList = document.getElementById("files-list");
		filesList.innerHTML = ``;

		for (let i = 0; i < this.files.length; i++) {
			const item = document.createElement("div");
			item.classList.add("section-header-elem");

			if (i === this.currentFile) {
				item.classList.add("selected");
			}

			item.innerText = this.files[i].name;
			filesList.appendChild(item);

			item.addEventListener("click", () => this.switchFile(this.files[i].name));
		}
	}

	switchFile(fileName) {
		const file = this.files.filter(f => f.name === fileName)[0];
		const index = this.files.indexOf(file);
		this.currentFile = index;
		this.renderFileTabs();
		this.isChanging = true;
		this.editor.setValue(file.code, -1);
		this.isChanging = false;
	}
}