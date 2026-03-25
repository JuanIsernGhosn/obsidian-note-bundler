import { getLanguage } from "obsidian";

interface Translations {
	[key: string]: string;
}

const en: Translations = {
	// Commands & menu
	exportNote: "Export Note",
	exportNotes: "Export Notes",

	// Modal title
	modalTitle: "Export note",
	modalTitleBatch: "Export notes",

	// Fields
	outputFolder: "Output folder",
	outputFolderDesc: "Absolute path where the export will be created",
	outputName: "Output name",
	outputNameDesc: "Name of the generated folder or ZIP",
	relatedAssets: "Related assets",
	relatedAssetsDesc: "Export assets (images, PDFs\u2026) from linked notes",
	frontmatter: "Frontmatter links",
	frontmatterDesc: "Include notes referenced in frontmatter properties",
	frontmatterExclude: "Exclude properties",
	frontmatterExcludeDesc: "Regex to exclude frontmatter property names (e.g. tags|aliases|cssclasses). Leave empty to include all.",
	depth: "Depth",
	depthDesc: "Recursion levels for linked notes",
	zip: "ZIP",
	zipDesc: "Package the output as a ZIP file",
	export: "Export",

	// Help
	help: "Help",
	helpTitle: "Export Note \u2014 Help",
	helpOutputFolder:
		"Absolute path on your system (outside the vault) where the exported folder or ZIP will be saved. Supports ~ for home directory.",
	helpOutputName:
		"Name for the exported folder (or ZIP file). Defaults to the note\u2019s name.",
	helpRelatedAssets:
		"When enabled, assets (images, PDFs, etc.) embedded in linked notes will also be exported to _related/_assets/.",
	helpFrontmatter:
		"When enabled, wikilinks ([[Note]]) found in any frontmatter property will be included as related notes. Use the exclude pattern to skip specific properties.",
	helpFrontmatterExclude:
		"A regex pattern matched against frontmatter property names. Matching properties are skipped when scanning for links. Example: tags|aliases|cssclasses will ignore those three fields. Leave empty to scan all properties.",
	helpDepth:
		"How many levels of linked notes to follow. Depth 1 = direct links only. Depth 2 = links of links, etc.",
	helpZip:
		"When enabled, the export is packaged into a single .zip file instead of a folder.",

	// Notices
	noActiveNote: "No active note.",
	exportComplete: "Export complete: {count} files",
	exportError: "Export error: {msg}",

	// Settings tab
	settingsTitle: "Export Note \u2014 Settings",
	defaultOutputFolder: "Default output folder",
	defaultOutputFolderDesc: "Absolute path where exports will be created",
	language: "Language",
	languageDesc: "Plugin language (auto = follow Obsidian)",
	langAuto: "Auto",

	// Summary modal
	summaryTitle: "Export summary",
	baseNote: "Base note",
	baseAssets: "Base note assets",
	relatedNotes: "Related notes",
	relatedAssetsCount: "Related assets",
	totalFiles: "Total files",
	notesNotFound: "Notes not found",
	assetsNotFound: "Assets not found",
	exportedTo: "Exported to",
	close: "Close",
	openFolder: "Open folder",

	// Batch
	batchProgress: "Exporting {current}/{total}\u2026",
	batchComplete: "Batch export complete: {count} notes exported",
	notesSelected: "notes selected",
};

const es: Translations = {
	exportNote: "Exportar nota",
	exportNotes: "Exportar notas",

	modalTitle: "Exportar nota",
	modalTitleBatch: "Exportar notas",

	outputFolder: "Carpeta destino",
	outputFolderDesc: "Ruta absoluta donde se crear\u00e1 la exportaci\u00f3n",
	outputName: "Nombre de salida",
	outputNameDesc: "Nombre de la carpeta o ZIP generado",
	relatedAssets: "Assets de relacionadas",
	relatedAssetsDesc: "Exportar assets (im\u00e1genes, PDFs\u2026) de las notas enlazadas",
	frontmatter: "Enlaces frontmatter",
	frontmatterDesc: "Incluir notas referenciadas en las propiedades del frontmatter",
	frontmatterExclude: "Excluir propiedades",
	frontmatterExcludeDesc: "Regex para excluir propiedades del frontmatter (ej. tags|aliases|cssclasses). Dejar vacío para incluir todas.",
	depth: "Profundidad",
	depthDesc: "Niveles de recursi\u00f3n para notas enlazadas",
	zip: "ZIP",
	zipDesc: "Empaquetar la salida en un archivo ZIP",
	export: "Exportar",

	help: "Ayuda",
	helpTitle: "Export Note \u2014 Ayuda",
	helpOutputFolder:
		"Ruta absoluta en tu sistema (fuera del vault) donde se guardar\u00e1 la carpeta o ZIP exportado. Soporta ~ para el directorio home.",
	helpOutputName:
		"Nombre de la carpeta exportada (o fichero ZIP). Por defecto, el nombre de la nota.",
	helpRelatedAssets:
		"Si est\u00e1 activado, los assets (im\u00e1genes, PDFs, etc.) embebidos en las notas enlazadas tambi\u00e9n se exportar\u00e1n a _related/_assets/.",
	helpFrontmatter:
		"Si está activado, los wikilinks ([[Nota]]) encontrados en cualquier propiedad del frontmatter se incluirán como notas relacionadas. Usa el patrón de exclusión para omitir propiedades específicas.",
	helpFrontmatterExclude:
		"Un patrón regex que se compara contra los nombres de las propiedades del frontmatter. Las propiedades que coincidan se omiten al buscar enlaces. Ejemplo: tags|aliases|cssclasses ignorará esos tres campos. Dejar vacío para escanear todas.",
	helpDepth:
		"Cu\u00e1ntos niveles de notas enlazadas seguir. Profundidad 1 = solo enlaces directos. Profundidad 2 = enlaces de enlaces, etc.",
	helpZip:
		"Si est\u00e1 activado, la exportaci\u00f3n se empaqueta en un \u00fanico fichero .zip en vez de una carpeta.",

	noActiveNote: "No hay ninguna nota activa.",
	exportComplete: "Exportaci\u00f3n completada: {count} ficheros",
	exportError: "Error al exportar: {msg}",

	settingsTitle: "Export Note \u2014 Configuraci\u00f3n",
	defaultOutputFolder: "Carpeta destino por defecto",
	defaultOutputFolderDesc: "Ruta absoluta donde se crear\u00e1n las exportaciones",
	language: "Idioma",
	languageDesc: "Idioma del plugin (auto = seguir Obsidian)",
	langAuto: "Auto",

	summaryTitle: "Resumen de exportaci\u00f3n",
	baseNote: "Nota base",
	baseAssets: "Assets nota base",
	relatedNotes: "Notas relacionadas",
	relatedAssetsCount: "Assets relacionadas",
	totalFiles: "Total ficheros",
	notesNotFound: "Notas no encontradas",
	assetsNotFound: "Assets no encontrados",
	exportedTo: "Exportado en",
	close: "Cerrar",
	openFolder: "Abrir carpeta",

	batchProgress: "Exportando {current}/{total}\u2026",
	batchComplete: "Exportaci\u00f3n batch completada: {count} notas exportadas",
	notesSelected: "notas seleccionadas",
};

const translations: Record<string, Translations> = { en, es };

export function t(key: string, vars?: Record<string, string | number>): string {
	const lang = getLanguage();
	const dict = translations[lang] || translations["en"];
	let text = dict[key] ?? translations["en"][key] ?? key;
	if (vars) {
		for (const [k, v] of Object.entries(vars)) {
			text = text.replace(`{${k}}`, String(v));
		}
	}
	return text;
}
