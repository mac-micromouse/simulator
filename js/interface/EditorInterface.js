class EditorInterface {
	constructor(container) {
		this.editor = ace.edit(container);
		this.editor.setTheme("ace/theme/one_dark");
		this.editor.setShowPrintMargin(false);
		this.editor.container.style.lineHeight = 1.4;
		this.editor.renderer.updateFontSize();
		this.editor.session.setMode("ace/mode/c_cpp");
	}
}