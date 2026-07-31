class Interface {
	constructor() {
		this.serial = new SerialInterface(document.getElementById("serial-interface"));
		this.editor = new EditorInterface(document.getElementById("code-editor"));
	}
}