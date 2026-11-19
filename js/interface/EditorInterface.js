class EditorInterface {
	constructor(container) {
		this.editor = ace.edit(container);
		this.editor.setTheme("ace/theme/one_dark");
		this.editor.setShowPrintMargin(false);
		this.editor.container.style.lineHeight = 1.4;
		this.editor.renderer.updateFontSize();
		this.editor.session.setMode("ace/mode/c_cpp");
		this.editor.setOption("scrollPastEnd", 1);
		this.isChanging = false;

		const DEFAULT_CODE = `#include "micromouse.h"

void setup() {
    Serial.println("Hello world!");
}

void loop() {

}`;

		this.defaultCode = DEFAULT_CODE;
		this.projects = [];
		this.currentProject = 0;
		this.currentFile = 0;

		if (localStorage.getItem("editor-projects")) {
			try {
				const savedProjects = JSON.parse(localStorage.getItem("editor-projects"));
				if (Array.isArray(savedProjects) && savedProjects.length > 0) {
					this.projects = savedProjects;
				}
			} catch (e) {
				console.error("Failed to parse editor-projects", e);
				this.projects = [];
			}
		}

		// Requirement 3: Migrate legacy editor-files into default project, then delete editor-files
		if (localStorage.getItem("editor-files")) {
			try {
				const migratedFiles = JSON.parse(localStorage.getItem("editor-files"));
				if (Array.isArray(migratedFiles) && migratedFiles.length > 0) {
					const defaultProj = this.projects.find(p => p.name === "Default");
					if (defaultProj) {
						defaultProj.files = migratedFiles;
					} else {
						this.projects.unshift({
							name: "Default",
							files: migratedFiles
						});
					}
				}
			} catch (e) {
				console.error("Failed to migrate editor-files", e);
			}
			localStorage.removeItem("editor-files");
		}

		// Ensure default project exists if no projects
		if (!this.projects || this.projects.length === 0) {
			this.projects = [{
				name: "Default",
				files: [{
					name: "bot.cpp",
					code: DEFAULT_CODE
				}]
			}];
		}

		// Ensure every project has at least one file
		for (const project of this.projects) {
			if (!project.files || project.files.length === 0) {
				project.files = [{
					name: "bot.cpp",
					code: DEFAULT_CODE
				}];
			}
		}

		let savedProjectIndex = parseInt(localStorage.getItem("editor-current-project"));
		if (isNaN(savedProjectIndex) || savedProjectIndex < 0 || savedProjectIndex >= this.projects.length) {
			savedProjectIndex = 0;
		}
		this.currentProject = savedProjectIndex;
		this.currentFile = 0;

		this.saveImmediate();

		this.renderProjectsList();
		this.renderFileTabs();

		this.editor.setValue(this.files[0].code, -1);
		this.editor.getSession().getUndoManager().reset();

		this.saveTimeout = null;
		this.editor.session.on("change", () => {
			if (this.isChanging) {
				return;
			}
			if (this.files && this.files[this.currentFile]) {
				this.files[this.currentFile].code = this.editor.getValue();
				this.startSaveProcess();
			}
		});

		window.addEventListener("resize", () => {
			this.editor.resize();
		});

		window.addEventListener("beforeunload", () => {
			this.saveImmediate();
		});
	}

	get files() {
		return this.projects[this.currentProject].files;
	}

	set files(val) {
		this.projects[this.currentProject].files = val;
	}

	renderProjectsList() {
		const projectsList = document.getElementById("projects-list");
		if (!projectsList) return;
		projectsList.innerHTML = "";

		for (let i = 0; i < this.projects.length; i++) {
			const project = this.projects[i];
			const item = document.createElement("div");
			item.classList.add("project-item");
			const isSelected = (i === this.currentProject);

			if (isSelected) {
				item.classList.add("selected");
			}

			const chevronIcon = isSelected ? "fa-chevron-down" : "fa-chevron-right";
			const folderIcon = isSelected ? "fa-folder-open" : "fa-folder";

			item.innerHTML = `
				<div class="project-info">
					<span class="fa ${chevronIcon} project-chevron"></span>
					<span class="fa ${folderIcon}"></span>
					<span class="project-name" title="${project.name}">${project.name}</span>
				</div>
				<div class="project-actions">
					${isSelected ? '<span class="fa fa-plus" title="Add file to project"></span>' : ''}
					<span class="fa fa-edit" title="Rename project"></span>
				</div>
			`;

			const actionsDiv = item.querySelector(".project-actions");

			if (isSelected) {
				const plusFileSpan = actionsDiv.querySelector(".fa-plus");
				if (plusFileSpan) {
					plusFileSpan.addEventListener("click", (event) => {
						event.stopPropagation();
						this.addFile("untitled", "");
					});
				}
			}

			if (this.projects.length > 1) {
				const trashSpan = document.createElement("span");
				trashSpan.classList.add("fa", "fa-trash");
				trashSpan.title = "Delete project";
				trashSpan.addEventListener("click", (event) => {
					event.stopPropagation();
					if (confirm(`Are you sure you want to delete project "${project.name}"?`)) {
						this.removeProject(i);
					}
				});
				actionsDiv.appendChild(trashSpan);
			}

			item.querySelector(".fa-edit").addEventListener("click", (event) => {
				event.stopPropagation();
				this.createEditProjectNameInput(item, i);
			});

			item.addEventListener("click", () => {
				if (this.currentProject !== i) {
					this.switchProject(i);
				}
			});

			projectsList.appendChild(item);

			// If project is active, display its flat filesystem tree below it
			if (isSelected) {
				const filesContainer = document.createElement("div");
				filesContainer.classList.add("project-files");

				for (let f = 0; f < project.files.length; f++) {
					const file = project.files[f];
					const isFileSelected = (f === this.currentFile);
					const fileItem = document.createElement("div");
					fileItem.classList.add("project-file-item");
					if (isFileSelected) {
						fileItem.classList.add("selected");
					}

					fileItem.innerHTML = `
						<div class="file-info">
							<span class="fa fa-file-code"></span>
							<span class="file-name" title="${file.name}">${file.name}</span>
						</div>
						<div class="file-actions">
							<span class="fa fa-download" title="Download file"></span>
						</div>
					`;

					const fileActions = fileItem.querySelector(".file-actions");

					if (f !== 0) {
						const editSpan = document.createElement("span");
						editSpan.classList.add("fa", "fa-edit");
						editSpan.title = "Rename file";
						editSpan.addEventListener("click", (event) => {
							event.stopPropagation();
							this.createEditSidebarFileNameInput(fileItem, f);
						});

						const trashSpan = document.createElement("span");
						trashSpan.classList.add("fa", "fa-trash");
						trashSpan.title = "Delete file";
						trashSpan.addEventListener("click", (event) => {
							event.stopPropagation();
							this.removeFile(file.name);
						});

						fileActions.appendChild(editSpan);
						fileActions.appendChild(trashSpan);
					}

					fileItem.querySelector(".fa-download").addEventListener("click", (event) => {
						event.stopPropagation();
						downloadFile(file.code, file.name, "text/x-c++src");
					});

					fileItem.addEventListener("click", (event) => {
						event.stopPropagation();
						if (this.currentFile !== f) {
							this.switchFile(file.name);
						}
					});

					filesContainer.appendChild(fileItem);
				}

				projectsList.appendChild(filesContainer);
			}
		}
	}

	renderFileTabs() {
		const filesList = document.getElementById("files-list");
		if (!filesList) return;
		filesList.innerHTML = ``;

		for (let i = 0; i < this.files.length; i++) {
			const item = document.createElement("div");
			item.classList.add("section-header-elem");

			if (i === this.currentFile) {
				item.classList.add("selected");
			}

			item.innerHTML = `
				<span class="file-name">${this.files[i].name}</span>
				<span class="fa fa-download"></span>
			`;

			if (i !== 0) {
				item.innerHTML += `
					<span class="fa fa-edit"></span>
					<span class="fa fa-trash"></span>
				`;

				item.querySelector(".fa-trash")
					.addEventListener("click", (event) => {
						event.stopPropagation();
						this.removeFile(this.files[i].name);
					});

				item.querySelector(".fa-edit")
					.addEventListener("click", (event) => {
						event.stopPropagation();
						this.createEditFileNameInput(item);
					});
			}

			item.querySelector(".fa-download")
				.addEventListener("click", (event) => {
					event.stopPropagation();
					downloadFile(this.files[i].code, this.files[i].name, "text/x-c++src");
				});

			filesList.appendChild(item);

			item.addEventListener("click", () => this.switchFile(this.files[i].name));
		}
	}

	switchProject(projectIndex) {
		if (this.files && this.files[this.currentFile]) {
			this.files[this.currentFile].code = this.editor.getValue();
		}

		this.currentProject = projectIndex;
		this.currentFile = 0;

		this.renderProjectsList();
		this.renderFileTabs();

		this.isChanging = true;
		this.editor.setValue(this.files[0].code, -1);
		this.editor.getSession().getUndoManager().reset();
		this.isChanging = false;

		this.saveImmediate();
		this.editor.resize();
	}

	addProject(name, files) {
		if (this.files && this.files[this.currentFile]) {
			this.files[this.currentFile].code = this.editor.getValue();
		}

		if (!name) {
			let baseName = "Project";
			let num = 1;
			while (this.projects.some(p => p.name === `${baseName} ${num}`)) {
				num++;
			}
			name = `${baseName} ${num}`;
		} else {
			const baseName = name;
			let num = 0;
			while (this.projects.some(p => p.name === `${baseName}${num ? ` (${num})` : ""}`)) {
				num++;
			}
			name = `${baseName}${num ? ` (${num})` : ""}`;
		}

		const projectFiles = (files && files.length > 0) ? files : [{
			name: "bot.cpp",
			code: this.defaultCode
		}];

		this.projects.push({
			name,
			files: projectFiles
		});

		this.switchProject(this.projects.length - 1);
	}

	removeProject(index) {
		if (this.projects.length <= 1) {
			return;
		}

		const isCurrent = (this.currentProject === index);
		this.projects.splice(index, 1);

		if (isCurrent) {
			this.currentProject = Math.min(index, this.projects.length - 1);
		} else if (this.currentProject > index) {
			this.currentProject--;
		}

		this.currentFile = 0;
		this.renderProjectsList();
		this.renderFileTabs();

		this.isChanging = true;
		this.editor.setValue(this.files[0].code, -1);
		this.editor.getSession().getUndoManager().reset();
		this.isChanging = false;

		this.saveImmediate();
		this.startSaveProcess();
	}

	createEditProjectNameInput(elem, index) {
		const projectNameSpan = elem.querySelector(".project-name");
		const projectActions = elem.querySelector(".project-actions");
		projectNameSpan.style.display = "none";
		if (projectActions) {
			projectActions.style.display = "none";
		}

		const input = document.createElement("input");
		input.classList.add("project-name-input");
		input.value = this.projects[index].name;
		elem.querySelector(".project-info").appendChild(input);
		input.focus();
		input.select();

		const setName = () => {
			const newName = input.value.trim();
			if (!newName || newName === this.projects[index].name) {
				this.renderProjectsList();
				return;
			}

			if (this.projects.some((p, idx) => idx !== index && p.name === newName)) {
				alert("A project with this name already exists.");
				this.renderProjectsList();
				return;
			}

			this.projects[index].name = newName;
			this.renderProjectsList();
			this.saveImmediate();
		};

		input.addEventListener("click", event => event.stopPropagation());
		input.addEventListener("blur", () => setName());
		input.addEventListener("keydown", event => {
			if (event.key.toLowerCase() === "enter") {
				setName();
			}

			if (event.key.toLowerCase() === "escape") {
				this.renderProjectsList();
			}
		});
	}

	switchFile(fileName) {
		if (this.files && this.files[this.currentFile]) {
			this.files[this.currentFile].code = this.editor.getValue();
		}
		const file = this.files.filter(f => f.name === fileName)[0];
		const index = this.files.indexOf(file);
		this.currentFile = index;
		this.renderFileTabs();
		this.renderProjectsList();
		this.isChanging = true;
		this.editor.setValue(file.code, -1);
		this.editor.getSession().getUndoManager().reset();
		this.isChanging = false;
	}

	addFile(name, code) {
		if (this.files && this.files[this.currentFile]) {
			this.files[this.currentFile].code = this.editor.getValue();
		}
		const baseName = name.split(".")[0];
		let fileNum = 0;
		while (this.files.filter(f => f.name === `${baseName}${fileNum ? ` (${fileNum})` : ""}.cpp`).length > 0) {
			fileNum++;
		}

		name = `${baseName}${fileNum ? ` (${fileNum})` : ""}.cpp`;
		this.files.push({ name, code });
		this.switchFile(name);
		this.saveImmediate();
	}

	removeFile(name) {
		const file = this.files.filter(f => f.name === name)[0];
		const index = this.files.indexOf(file);

		this.files.splice(index, 1);
		if (this.currentFile === index) {
			this.currentFile = Math.max(0, this.currentFile - 1);
			this.switchFile(this.files[this.currentFile].name);
		} else {
			if (this.currentFile > index) {
				this.currentFile--;
			}
			this.renderFileTabs();
			this.renderProjectsList();
			this.saveImmediate();
			this.startSaveProcess();
		}
	}

	saveImmediate() {
		localStorage.setItem("editor-projects", JSON.stringify(this.projects));
		localStorage.setItem("editor-current-project", this.currentProject.toString());
	}

	startSaveProcess() {
		const saveButton = document.getElementById("save-button");
		if (saveButton && saveButton.children[0]) {
			saveButton.children[0].classList.replace("fa-check", "fa-ellipsis");
			saveButton.title = "Saving...";
			saveButton.style.color = "rgb(204, 208, 214)";
		}
		window.clearTimeout(this.saveTimeout);

		this.saveTimeout = window.setTimeout(() => {
			this.saveImmediate();
			if (saveButton && saveButton.children[0]) {
				saveButton.children[0].classList.replace("fa-ellipsis", "fa-check");
				saveButton.title = "Saved!";
				saveButton.style.color = "rgb(100, 230, 100)";
			}
		}, 1500);
	}

	createEditFileNameInput(elem) {
		const fileNameSpan = elem.querySelector(".file-name");
		fileNameSpan.style.display = "none";

		const input = document.createElement("input");
		input.classList.add("file-name-input");
		input.value = fileNameSpan.innerText;
		elem.insertBefore(input, fileNameSpan);
		input.focus();

		const setName = () => {
			if (input.value === fileNameSpan.innerText) {
				this.renderFileTabs();
				this.renderProjectsList();
				return;
			}

			if (this.files.filter(file => file.name === input.value).length > 0) {
				return;
			}

			this.files.filter(file => file.name === fileNameSpan.innerText)[0]
				.name = input.value;
			this.renderFileTabs();
			this.renderProjectsList();
			this.saveImmediate();
		};

		input.addEventListener("click", event => event.stopPropagation());
		input.addEventListener("blur", () => setName());
		input.addEventListener("keydown", event => {
			if (event.key.toLowerCase() === "enter") {
				setName();
			}

			if (event.key.toLowerCase() === "escape") {
				this.renderFileTabs();
				this.renderProjectsList();
			}
		});
	}

	createEditSidebarFileNameInput(elem, fileIndex) {
		const fileNameSpan = elem.querySelector(".file-name");
		const fileActions = elem.querySelector(".file-actions");
		fileNameSpan.style.display = "none";
		if (fileActions) fileActions.style.display = "none";

		const input = document.createElement("input");
		input.classList.add("file-name-input");
		input.value = this.files[fileIndex].name;
		elem.querySelector(".file-info").appendChild(input);
		input.focus();
		input.select();

		const setName = () => {
			const newName = input.value.trim();
			if (!newName || newName === this.files[fileIndex].name) {
				this.renderProjectsList();
				this.renderFileTabs();
				return;
			}

			if (this.files.some((f, idx) => idx !== fileIndex && f.name === newName)) {
				alert("A file with this name already exists.");
				this.renderProjectsList();
				this.renderFileTabs();
				return;
			}

			this.files[fileIndex].name = newName;
			this.renderProjectsList();
			this.renderFileTabs();
			this.saveImmediate();
		};

		input.addEventListener("click", event => event.stopPropagation());
		input.addEventListener("blur", () => setName());
		input.addEventListener("keydown", event => {
			if (event.key.toLowerCase() === "enter") {
				setName();
			}

			if (event.key.toLowerCase() === "escape") {
				this.renderProjectsList();
				this.renderFileTabs();
			}
		});
	}
}
