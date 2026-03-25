import { App, Modal, Notice, Setting, TFile } from "obsidian";
import { t } from "./i18n";
import { ExportEngine, ExportResult, ExportOptions, expandHome } from "./export-engine";
import type ExportNotePlugin from "./main";

// ── Styles ─────────────────────────────────────────────────────────────

const STYLES = `
.export-note-title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 12px;
}
.export-note-title h2 {
	margin: 0;
}
.export-note-help-btn {
	border-radius: 50%;
	width: 28px;
	height: 28px;
	cursor: pointer;
	font-weight: bold;
	font-size: 14px;
	display: flex;
	align-items: center;
	justify-content: center;
}
.export-note-summary-table {
	width: 100%;
	border-collapse: collapse;
	margin: 12px 0;
}
.export-note-summary-table td {
	padding: 4px 8px;
}
.export-note-summary-table td:first-child {
	font-weight: 600;
}
.export-note-summary-table td:last-child {
	text-align: right;
}
.export-note-missing {
	margin-top: 12px;
	padding: 8px 12px;
	border-radius: 6px;
	background: var(--background-modifier-error);
	color: var(--text-on-accent);
	font-size: 0.85em;
}
.export-note-missing h4 {
	margin: 0 0 4px 0;
}
.export-note-missing ul {
	margin: 0;
	padding-left: 20px;
}
.export-note-output-path {
	margin-top: 12px;
	padding: 8px 12px;
	border-radius: 6px;
	background: var(--background-modifier-success);
	font-size: 0.85em;
	word-break: break-all;
}
.export-note-summary-buttons {
	display: flex;
	gap: 8px;
	justify-content: flex-end;
	margin-top: 16px;
}
`;

function injectStyles(): void {
	if (!document.getElementById("export-note-styles")) {
		const style = document.createElement("style");
		style.id = "export-note-styles";
		style.textContent = STYLES;
		document.head.appendChild(style);
	}
}

// ── Help Modal ─────────────────────────────────────────────────────────

export class HelpModal extends Modal {
	onOpen(): void {
		const { contentEl } = this;
		contentEl.createEl("h2", { text: t("helpTitle") });

		const fields = [
			{ name: t("outputFolder"), help: t("helpOutputFolder") },
			{ name: t("outputName"), help: t("helpOutputName") },
			{ name: t("relatedAssets"), help: t("helpRelatedAssets") },
			{ name: t("frontmatter"), help: t("helpFrontmatter") },
			{ name: t("depth"), help: t("helpDepth") },
			{ name: t("zip"), help: t("helpZip") },
		];

		for (const field of fields) {
			const div = contentEl.createDiv({ cls: "setting-item" });
			div.createEl("strong", { text: field.name });
			div.createEl("p", { text: field.help });
		}
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Summary Modal ──────────────────────────────────────────────────────

export class SummaryModal extends Modal {
	private result: ExportResult;

	constructor(app: App, result: ExportResult) {
		super(app);
		this.result = result;
	}

	onOpen(): void {
		injectStyles();
		const { contentEl } = this;
		const r = this.result;

		contentEl.createEl("h2", { text: t("summaryTitle") });

		const table = contentEl.createEl("table", { cls: "export-note-summary-table" });
		const rows = [
			[t("baseNote"), "1"],
			[t("baseAssets"), String(r.baseAssets)],
			[t("relatedNotes"), String(r.relatedNotes)],
			[t("relatedAssetsCount"), String(r.relatedAssets)],
			[t("totalFiles"), String(r.baseNotes + r.baseAssets + r.relatedNotes + r.relatedAssets)],
		];

		for (const [label, value] of rows) {
			const tr = table.createEl("tr");
			tr.createEl("td", { text: label });
			tr.createEl("td", { text: value });
		}

		// Missing notes
		if (r.notesMissing.length > 0) {
			const div = contentEl.createDiv({ cls: "export-note-missing" });
			div.createEl("h4", { text: `${t("notesNotFound")} (${r.notesMissing.length})` });
			const ul = div.createEl("ul");
			for (const n of r.notesMissing) {
				ul.createEl("li", { text: n });
			}
		}

		// Missing assets
		if (r.assetsMissing.length > 0) {
			const div = contentEl.createDiv({ cls: "export-note-missing" });
			div.createEl("h4", { text: `${t("assetsNotFound")} (${r.assetsMissing.length})` });
			const ul = div.createEl("ul");
			for (const a of r.assetsMissing) {
				ul.createEl("li", { text: a });
			}
		}

		// Output path
		const pathDiv = contentEl.createDiv({ cls: "export-note-output-path" });
		pathDiv.createEl("strong", { text: `${t("exportedTo")}: ` });
		pathDiv.createSpan({ text: r.outputPath });

		// Buttons
		const btnRow = contentEl.createDiv({ cls: "export-note-summary-buttons" });

		const openBtn = btnRow.createEl("button", { text: t("openFolder") });
		openBtn.addEventListener("click", () => {
			const { exec } = require("child_process");
			const folderPath = r.outputPath.endsWith(".zip")
				? require("path").dirname(r.outputPath)
				: r.outputPath;
			exec(`open "${folderPath}"`);
		});

		const closeBtn = btnRow.createEl("button", { text: t("close"), cls: "mod-cta" });
		closeBtn.addEventListener("click", () => this.close());
	}

	onClose(): void {
		this.contentEl.empty();
	}
}

// ── Export Modal (single note) ─────────────────────────────────────────

export class ExportModal extends Modal {
	private plugin: ExportNotePlugin;
	private file: TFile;
	private outputPath: string;
	private outputName: string;
	private includeRelatedAssets: boolean;
	private includeFrontmatter: boolean;
	private depth: number;
	private zipOutput: boolean;

	constructor(app: App, plugin: ExportNotePlugin, file: TFile) {
		super(app);
		this.plugin = plugin;
		this.file = file;
		this.outputPath = plugin.settings.outputPath;
		this.outputName = file.basename;
		this.includeRelatedAssets = plugin.settings.includeRelatedAssets;
		this.includeFrontmatter = plugin.settings.includeFrontmatter;
		this.depth = plugin.settings.depth;
		this.zipOutput = plugin.settings.zipOutput;
	}

	onOpen(): void {
		injectStyles();
		const { contentEl } = this;

		// Title row with help button
		const titleRow = contentEl.createDiv({ cls: "export-note-title" });
		titleRow.createEl("h2", { text: t("modalTitle") });
		const helpBtn = titleRow.createEl("button", {
			text: "?",
			cls: "export-note-help-btn",
		});
		helpBtn.addEventListener("click", () => new HelpModal(this.app).open());

		new Setting(contentEl)
			.setName(t("outputFolder"))
			.setDesc(t("outputFolderDesc"))
			.addText((text) =>
				text.setValue(this.outputPath).onChange((v) => (this.outputPath = v)),
			);

		new Setting(contentEl)
			.setName(t("outputName"))
			.setDesc(t("outputNameDesc"))
			.addText((text) =>
				text.setValue(this.outputName).onChange((v) => (this.outputName = v)),
			);

		new Setting(contentEl)
			.setName(t("relatedAssets"))
			.setDesc(t("relatedAssetsDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.includeRelatedAssets)
					.onChange((v) => (this.includeRelatedAssets = v)),
			);

		new Setting(contentEl)
			.setName(t("frontmatter"))
			.setDesc(t("frontmatterDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.includeFrontmatter)
					.onChange((v) => (this.includeFrontmatter = v)),
			);

		new Setting(contentEl)
			.setName(t("depth"))
			.setDesc(t("depthDesc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("1", "1");
				dropdown.addOption("2", "2");
				dropdown.addOption("3", "3");
				dropdown.setValue(String(this.depth));
				dropdown.onChange((v) => (this.depth = parseInt(v)));
			});

		new Setting(contentEl)
			.setName(t("zip"))
			.setDesc(t("zipDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.zipOutput).onChange((v) => (this.zipOutput = v)),
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("export"))
				.setCta()
				.onClick(async () => {
					await this.doExport();
				}),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async doExport(): Promise<void> {
		// Persist settings
		this.plugin.settings.outputPath = this.outputPath;
		this.plugin.settings.includeRelatedAssets = this.includeRelatedAssets;
		this.plugin.settings.includeFrontmatter = this.includeFrontmatter;
		this.plugin.settings.depth = this.depth;
		this.plugin.settings.zipOutput = this.zipOutput;
		await this.plugin.saveSettings();

		const baseDest = expandHome(this.outputPath);

		try {
			const engine = new ExportEngine(this.app);
			const result = await engine.exportNote(this.file, baseDest, this.outputName, {
				includeRelatedAssets: this.includeRelatedAssets,
				includeFrontmatter: this.includeFrontmatter,
				depth: this.depth,
				zipOutput: this.zipOutput,
			});

			this.close();
			new SummaryModal(this.app, result).open();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(t("exportError", { msg }));
			console.error("Export Note error:", err);
		}
	}
}

// ── Batch Export Modal (multi-select) ──────────────────────────────────

export class BatchExportModal extends Modal {
	private plugin: ExportNotePlugin;
	private files: TFile[];
	private outputPath: string;
	private includeRelatedAssets: boolean;
	private includeFrontmatter: boolean;
	private depth: number;
	private zipOutput: boolean;

	constructor(app: App, plugin: ExportNotePlugin, files: TFile[]) {
		super(app);
		this.plugin = plugin;
		this.files = files;
		this.outputPath = plugin.settings.outputPath;
		this.includeRelatedAssets = plugin.settings.includeRelatedAssets;
		this.includeFrontmatter = plugin.settings.includeFrontmatter;
		this.depth = plugin.settings.depth;
		this.zipOutput = plugin.settings.zipOutput;
	}

	onOpen(): void {
		injectStyles();
		const { contentEl } = this;

		const titleRow = contentEl.createDiv({ cls: "export-note-title" });
		titleRow.createEl("h2", {
			text: `${t("modalTitleBatch")} (${this.files.length} ${t("notesSelected")})`,
		});
		const helpBtn = titleRow.createEl("button", {
			text: "?",
			cls: "export-note-help-btn",
		});
		helpBtn.addEventListener("click", () => new HelpModal(this.app).open());

		// List selected notes
		const list = contentEl.createEl("ul");
		for (const f of this.files) {
			list.createEl("li", { text: f.basename });
		}

		new Setting(contentEl)
			.setName(t("outputFolder"))
			.setDesc(t("outputFolderDesc"))
			.addText((text) =>
				text.setValue(this.outputPath).onChange((v) => (this.outputPath = v)),
			);

		new Setting(contentEl)
			.setName(t("relatedAssets"))
			.setDesc(t("relatedAssetsDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.includeRelatedAssets)
					.onChange((v) => (this.includeRelatedAssets = v)),
			);

		new Setting(contentEl)
			.setName(t("frontmatter"))
			.setDesc(t("frontmatterDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.includeFrontmatter)
					.onChange((v) => (this.includeFrontmatter = v)),
			);

		new Setting(contentEl)
			.setName(t("depth"))
			.setDesc(t("depthDesc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("1", "1");
				dropdown.addOption("2", "2");
				dropdown.addOption("3", "3");
				dropdown.setValue(String(this.depth));
				dropdown.onChange((v) => (this.depth = parseInt(v)));
			});

		new Setting(contentEl)
			.setName(t("zip"))
			.setDesc(t("zipDesc"))
			.addToggle((toggle) =>
				toggle.setValue(this.zipOutput).onChange((v) => (this.zipOutput = v)),
			);

		new Setting(contentEl).addButton((btn) =>
			btn
				.setButtonText(t("export"))
				.setCta()
				.onClick(async () => {
					await this.doBatchExport();
				}),
		);
	}

	onClose(): void {
		this.contentEl.empty();
	}

	private async doBatchExport(): Promise<void> {
		this.plugin.settings.outputPath = this.outputPath;
		this.plugin.settings.includeRelatedAssets = this.includeRelatedAssets;
		this.plugin.settings.includeFrontmatter = this.includeFrontmatter;
		this.plugin.settings.depth = this.depth;
		this.plugin.settings.zipOutput = this.zipOutput;
		await this.plugin.saveSettings();

		const baseDest = expandHome(this.outputPath);
		const engine = new ExportEngine(this.app);
		const options: ExportOptions = {
			includeRelatedAssets: this.includeRelatedAssets,
			includeFrontmatter: this.includeFrontmatter,
			depth: this.depth,
			zipOutput: this.zipOutput,
		};

		const allResults: ExportResult[] = [];

		try {
			for (let i = 0; i < this.files.length; i++) {
				const file = this.files[i];
				new Notice(t("batchProgress", { current: i + 1, total: this.files.length }));
				const result = await engine.exportNote(file, baseDest, file.basename, options);
				allResults.push(result);
			}

			this.close();

			// Aggregate results
			const aggregated: ExportResult = {
				baseNotes: allResults.reduce((s, r) => s + r.baseNotes, 0),
				baseAssets: allResults.reduce((s, r) => s + r.baseAssets, 0),
				relatedNotes: allResults.reduce((s, r) => s + r.relatedNotes, 0),
				relatedAssets: allResults.reduce((s, r) => s + r.relatedAssets, 0),
				notesMissing: [...new Set(allResults.flatMap((r) => r.notesMissing))],
				assetsMissing: [...new Set(allResults.flatMap((r) => r.assetsMissing))],
				outputPath: baseDest,
			};

			new SummaryModal(this.app, aggregated).open();
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			new Notice(t("exportError", { msg }));
			console.error("Export Note batch error:", err);
		}
	}
}
