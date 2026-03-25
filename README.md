# Obsidian Note Bundler

Bundle your Obsidian notes with their linked notes and attachments into a portable folder or ZIP.

## Features

- **Bundle active note** with all linked notes and embedded assets
- **Context menu** support — right-click a note (or multiple notes) in the file explorer
- **Batch bundle** — select multiple notes and bundle them all at once
- **Recursive bundling** — follow links up to 3 levels deep
- **Frontmatter links** — optionally include notes referenced in YAML frontmatter fields
- **ZIP output** — package everything into a single `.zip` file
- **Multi-language** — English and Spanish, auto-detected from Obsidian settings
- **Help button** — in-modal `?` button explaining every option
- **Summary modal** — post-export summary with file counts, missing references, and "Open folder" button
- **Ribbon icon** — quick access from the sidebar

## Bundle Structure

```
NoteName/
├── NoteName.md              # Base note
├── _assets/                 # Attachments from the base note
│   ├── image.png
│   └── document.pdf
└── _related/                # Linked notes
    ├── LinkedNote1.md
    ├── LinkedNote2.md
    └── _assets/             # Attachments from linked notes
        └── diagram.svg
```

## Installation

### Manual

1. Download the latest release (`main.js`, `manifest.json`)
2. Create a folder `.obsidian/plugins/obsidian-note-bundler/` in your vault
3. Copy the files into that folder
4. Restart Obsidian
5. Enable "Note Bundler" in Settings > Community plugins

### From source

```bash
git clone https://github.com/juanisernghosn/obsidian-note-bundler.git
cd obsidian-note-bundler
npm install
npm run build
```

Copy `main.js` and `manifest.json` to your vault's plugin folder.

## Usage

### Command Palette
`Cmd/Ctrl + P` > **Export Note**

### Context Menu
Right-click any `.md` file in the file explorer > **Export Note**

### Multiple Notes
Select multiple files > right-click > **Export Notes (N)**

### Options

| Option | Default | Description |
|--------|---------|-------------|
| Output folder | `~/Desktop` | Absolute path for the export |
| Output name | Note name | Name of the folder/ZIP |
| Related assets | ON | Include assets from linked notes |
| Frontmatter links | OFF | Include notes from `relacionado_con` field |
| Depth | 1 | Recursion depth (1-3) |
| ZIP | OFF | Package as `.zip` instead of folder |

## Requirements

- Obsidian v0.15.0+
- Desktop only (uses Node.js `fs` for writing outside the vault)
- macOS `zip` command for ZIP output (pre-installed on macOS)

## License

[MIT](LICENSE)
