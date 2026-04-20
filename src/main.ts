import { Notice, Plugin, PluginSettingTab, Setting, TFile, App } from "obsidian";
import { t } from "./i18n";
import { ExportModal, BatchExportModal } from "./export-modal";

// ── Settings ───────────────────────────────────────────────────────────

export interface ExportNoteSettings {
	outputPath: string;
	includeRelatedAssets: boolean;
	includeFrontmatter: boolean;
	frontmatterExcludePattern: string;
	includeBacklinks: boolean;
	depth: number;
	zipOutput: boolean;
}

const DEFAULT_SETTINGS: ExportNoteSettings = {
	outputPath: "~/Desktop",
	includeRelatedAssets: true,
	includeFrontmatter: false,
	frontmatterExcludePattern: "",
	includeBacklinks: false,
	depth: 1,
	zipOutput: false,
};

// ── Plugin ─────────────────────────────────────────────────────────────

export default class ExportNotePlugin extends Plugin {
	settings: ExportNoteSettings = DEFAULT_SETTINGS;

	async onload(): Promise<void> {
		await this.loadSettings();

		// Command palette
		this.addCommand({
			id: "export-note",
			name: t("exportNote"),
			callback: () => {
				const file = this.app.workspace.getActiveFile();
				if (!file) {
					new Notice(t("noActiveNote"));
					return;
				}
				new ExportModal(this.app, this, file).open();
			},
		});

		// Ribbon icon
		this.addRibbonIcon("folder-output", t("exportNote"), () => {
			const file = this.app.workspace.getActiveFile();
			if (!file) {
				new Notice(t("noActiveNote"));
				return;
			}
			new ExportModal(this.app, this, file).open();
		});

		// Context menu: single file
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile && file.extension === "md") {
					menu.addItem((item) => {
						item.setTitle(t("exportNote"));
						item.setIcon("folder-output");
						item.onClick(() =>
							new ExportModal(this.app, this, file).open(),
						);
					});
				}
			}),
		);

		// Context menu: multiple files
		this.registerEvent(
			(this.app.workspace as any).on(
				"files-menu",
				(menu: any, files: any[]) => {
					const mdFiles = files.filter(
						(f): f is TFile =>
							f instanceof TFile && f.extension === "md",
					);
					if (mdFiles.length > 0) {
						menu.addItem((item: any) => {
							item.setTitle(
								`${t("exportNotes")} (${mdFiles.length})`,
							);
							item.setIcon("folder-output");
							item.onClick(() =>
								new BatchExportModal(
									this.app,
									this,
									mdFiles,
								).open(),
							);
						});
					}
				},
			),
		);

		// Settings tab
		this.addSettingTab(new ExportNoteSettingTab(this.app, this));
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData(),
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

// ── Settings Tab ───────────────────────────────────────────────────────

class ExportNoteSettingTab extends PluginSettingTab {
	plugin: ExportNotePlugin;

	constructor(app: App, plugin: ExportNotePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.createEl("h2", { text: t("settingsTitle") });

		new Setting(containerEl)
			.setName(t("defaultOutputFolder"))
			.setDesc(t("defaultOutputFolderDesc"))
			.addText((text) =>
				text
					.setPlaceholder("~/Desktop")
					.setValue(this.plugin.settings.outputPath)
					.onChange(async (v) => {
						this.plugin.settings.outputPath = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("relatedAssets"))
			.setDesc(t("relatedAssetsDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeRelatedAssets)
					.onChange(async (v) => {
						this.plugin.settings.includeRelatedAssets = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("frontmatter"))
			.setDesc(t("frontmatterDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeFrontmatter)
					.onChange(async (v) => {
						this.plugin.settings.includeFrontmatter = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("frontmatterExclude"))
			.setDesc(t("frontmatterExcludeDesc"))
			.addText((text) =>
				text
					.setPlaceholder("tags|aliases|cssclasses")
					.setValue(this.plugin.settings.frontmatterExcludePattern)
					.onChange(async (v) => {
						this.plugin.settings.frontmatterExcludePattern = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("backlinks"))
			.setDesc(t("backlinksDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.includeBacklinks)
					.onChange(async (v) => {
						this.plugin.settings.includeBacklinks = v;
						await this.plugin.saveSettings();
					}),
			);

		new Setting(containerEl)
			.setName(t("depth"))
			.setDesc(t("depthDesc"))
			.addDropdown((dropdown) => {
				dropdown.addOption("1", "1");
				dropdown.addOption("2", "2");
				dropdown.addOption("3", "3");
				dropdown.setValue(String(this.plugin.settings.depth));
				dropdown.onChange(async (v) => {
					this.plugin.settings.depth = parseInt(v);
					await this.plugin.saveSettings();
				});
			});

		new Setting(containerEl)
			.setName(t("zip"))
			.setDesc(t("zipDesc"))
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.zipOutput)
					.onChange(async (v) => {
						this.plugin.settings.zipOutput = v;
						await this.plugin.saveSettings();
					}),
			);
	}
}
