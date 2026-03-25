import { App, TFile } from "obsidian";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import * as os from "os";

// ── Regex ──────────────────────────────────────────────────────────────
const WIKILINK_RE = /(?<!!)\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const EMBED_RE = /!\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---/;
const FRONTMATTER_LINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;

const NON_MD_EXTENSIONS = new Set([
	".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
	".pdf", ".html", ".css", ".js",
	".wav", ".mp3", ".mp4", ".webm",
	".csv", ".xlsx", ".docx", ".pptx",
]);

// ── Types ──────────────────────────────────────────────────────────────

export interface ExportOptions {
	includeRelatedAssets: boolean;
	includeFrontmatter: boolean;
	depth: number;
	zipOutput: boolean;
}

export interface ExportResult {
	baseNotes: number;
	baseAssets: number;
	relatedNotes: number;
	relatedAssets: number;
	notesMissing: string[];
	assetsMissing: string[];
	outputPath: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

export function expandHome(p: string): string {
	if (p.startsWith("~/") || p === "~") {
		return p.replace("~", os.homedir());
	}
	return p;
}

function matchAll(re: RegExp, text: string): string[] {
	const results: string[] = [];
	const regex = new RegExp(re.source, re.flags);
	let m: RegExpExecArray | null;
	while ((m = regex.exec(text)) !== null) {
		results.push(m[1]);
	}
	return results;
}

export function extractLinks(content: string): { wikilinks: Set<string>; embeds: Set<string> } {
	return {
		wikilinks: new Set(matchAll(WIKILINK_RE, content)),
		embeds: new Set(matchAll(EMBED_RE, content)),
	};
}

export function classifyLinks(
	wikilinks: Set<string>,
	embeds: Set<string>,
): { notes: Set<string>; assets: Set<string> } {
	const notes = new Set<string>();
	const allAssets = new Set(embeds);
	for (const link of wikilinks) {
		const ext = path.extname(link).toLowerCase();
		if (NON_MD_EXTENSIONS.has(ext)) {
			allAssets.add(link);
		} else {
			notes.add(link);
		}
	}
	return { notes, assets: allAssets };
}

export function extractFrontmatterLinks(content: string): Set<string> {
	const match = FRONTMATTER_RE.exec(content);
	if (!match) return new Set();
	const frontmatter = match[1];
	const links = new Set<string>();
	let inRelacionado = false;
	for (const line of frontmatter.split("\n")) {
		const stripped = line.trim();
		if (stripped.startsWith("relacionado_con")) {
			inRelacionado = true;
			continue;
		}
		if (inRelacionado) {
			if (stripped.startsWith("- ")) {
				for (const m of matchAll(FRONTMATTER_LINK_RE, stripped)) {
					links.add(m);
				}
			} else {
				break;
			}
		}
	}
	return links;
}

// ── Export Engine ───────────────────────────────────────────────────────

export class ExportEngine {
	private app: App;

	constructor(app: App) {
		this.app = app;
	}

	resolveNote(name: string): TFile | null {
		const files = this.app.vault.getFiles();

		if (name.includes("/")) {
			const found = this.app.vault.getAbstractFileByPath(name);
			if (found instanceof TFile) return found;
		}

		const target = name.endsWith(".md") ? name : `${name}.md`;
		const basename = path.basename(target);

		return files.find((f) => f.name === basename) ?? null;
	}

	resolveAsset(name: string): TFile | null {
		const files = this.app.vault.getFiles();

		if (name.includes("/")) {
			const found = this.app.vault.getAbstractFileByPath(name);
			if (found instanceof TFile) return found;
		}

		const basename = path.basename(name);

		const inAssets = files.find(
			(f) => f.path.startsWith("_assets/") && f.name === basename,
		);
		if (inAssets) return inAssets;

		return files.find((f) => f.name === basename) ?? null;
	}

	async writeFileToDisk(file: TFile, destPath: string): Promise<void> {
		const dir = path.dirname(destPath);
		fs.mkdirSync(dir, { recursive: true });

		if (file.extension === "md" || file.extension === "txt") {
			const content = await this.app.vault.read(file);
			fs.writeFileSync(destPath, content, "utf-8");
		} else {
			const buffer = await this.app.vault.readBinary(file);
			fs.writeFileSync(destPath, Buffer.from(buffer));
		}
	}

	async collectAssets(
		embeds: Set<string>,
		assetsDest: string,
	): Promise<{ found: number; missing: string[] }> {
		let found = 0;
		const missing: string[] = [];

		for (const embed of Array.from(embeds).sort()) {
			const resolved = this.resolveAsset(embed);
			if (resolved) {
				await this.writeFileToDisk(
					resolved,
					path.join(assetsDest, resolved.name),
				);
				found++;
			} else {
				missing.push(embed);
			}
		}
		return { found, missing };
	}

	async exportNote(
		file: TFile,
		destDir: string,
		outputName: string,
		options: ExportOptions,
		onProgress?: (msg: string) => void,
	): Promise<ExportResult> {
		const dest = path.join(destDir, outputName);
		const finalDest = options.zipOutput
			? path.join(os.tmpdir(), `export-note-${Date.now()}`, outputName)
			: dest;

		fs.mkdirSync(finalDest, { recursive: true });

		const assetsDest = path.join(finalDest, "_assets");
		const relatedDest = path.join(finalDest, "_related");
		const relatedAssetsDest = path.join(relatedDest, "_assets");

		const visited = new Set<string>();
		let totalNotes = 0;
		let totalBaseAssets = 0;
		let totalRelatedAssets = 0;
		const allNotesMissing: string[] = [];
		const allAssetsMissing: string[] = [];

		// Base note
		const content = await this.app.vault.read(file);
		await this.writeFileToDisk(file, path.join(finalDest, file.name));
		visited.add(file.basename);

		// Base note assets
		const { wikilinks, embeds } = extractLinks(content);
		const { notes: noteLinks, assets } = classifyLinks(wikilinks, embeds);
		const baseResult = await this.collectAssets(assets, assetsDest);
		totalBaseAssets = baseResult.found;
		allAssetsMissing.push(...baseResult.missing);

		// Frontmatter
		if (options.includeFrontmatter) {
			const fmLinks = extractFrontmatterLinks(content);
			fmLinks.forEach((l) => noteLinks.add(l));
		}

		noteLinks.delete(file.basename);

		// BFS queue
		const queue: Array<{ link: string; depth: number }> = [];
		for (const link of Array.from(noteLinks).sort()) {
			queue.push({ link, depth: 1 });
		}

		while (queue.length > 0) {
			const { link, depth: currentDepth } = queue.shift()!;

			if (visited.has(link)) continue;

			const resolved = this.resolveNote(link);
			if (!resolved) {
				if (!allNotesMissing.includes(link)) {
					allNotesMissing.push(link);
				}
				continue;
			}

			visited.add(link);
			fs.mkdirSync(relatedDest, { recursive: true });
			await this.writeFileToDisk(
				resolved,
				path.join(relatedDest, resolved.name),
			);
			totalNotes++;

			if (onProgress) {
				onProgress(resolved.name);
			}

			let relContent: string;
			try {
				relContent = await this.app.vault.read(resolved);
			} catch {
				continue;
			}

			// Related note assets
			if (options.includeRelatedAssets) {
				const relLinks = extractLinks(relContent);
				const { assets: relAssets } = classifyLinks(
					relLinks.wikilinks,
					relLinks.embeds,
				);
				if (relAssets.size > 0) {
					const relResult = await this.collectAssets(
						relAssets,
						relatedAssetsDest,
					);
					totalRelatedAssets += relResult.found;
					allAssetsMissing.push(...relResult.missing);
				}
			}

			// Recursion
			if (currentDepth < options.depth) {
				const childLinks = extractLinks(relContent);
				const { notes: childNotes } = classifyLinks(
					childLinks.wikilinks,
					new Set(),
				);
				if (options.includeFrontmatter) {
					extractFrontmatterLinks(relContent).forEach((l) =>
						childNotes.add(l),
					);
				}
				for (const childLink of Array.from(childNotes).sort()) {
					if (!visited.has(childLink)) {
						queue.push({ link: childLink, depth: currentDepth + 1 });
					}
				}
			}
		}

		// ZIP
		let outputPath = dest;
		if (options.zipOutput) {
			const zipPath = `${dest}.zip`;
			const parentDir = path.dirname(finalDest);
			execSync(`cd "${parentDir}" && zip -r "${zipPath}" "${outputName}"`);
			fs.rmSync(path.dirname(finalDest), { recursive: true, force: true });
			outputPath = zipPath;
		}

		return {
			baseNotes: 1,
			baseAssets: totalBaseAssets,
			relatedNotes: totalNotes,
			relatedAssets: totalRelatedAssets,
			notesMissing: allNotesMissing,
			assetsMissing: [...new Set(allAssetsMissing)],
			outputPath,
		};
	}
}
