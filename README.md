# SprintFlow

<p align="center">
  <strong>Minimal, offline Scrum sprint & SDLC workflow desktop application built with Electron.js.</strong>
</p>

<p align="center">
  <a href="https://github.com/munawaralimangat/sprintflow-desktop/releases/latest">
    <img src="https://img.shields.io/badge/Download-Windows_Installer_(.exe)-0078D4?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows Installer">
  </a>
  <a href="https://github.com/munawaralimangat/sprintflow-desktop/releases">
    <img src="https://img.shields.io/github/v/release/munawaralimangat/sprintflow-desktop?style=for-the-badge&color=10b981" alt="Latest Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  </a>
</p>

---

## 📥 Download & Installation

Get the latest installer for Windows:

- 🪟 **[Download SprintFlow Setup (.exe)](https://github.com/munawaralimangat/sprintflow-desktop/releases/latest)**
- 📦 **[Browse All Releases & Versions](https://github.com/munawaralimangat/sprintflow-desktop/releases)**

### Installation Instructions
1. Download the latest `SprintFlow Setup x.x.x.exe` from the link above.
2. Run the executable installer.
3. Launch **SprintFlow** from your Start menu or Desktop shortcut.

---

## ✨ Features

- 📋 **Kanban Swimlane Board**: Side-by-side workflow columns with spacious layout and horizontal scroll.
- 🔄 **Drag & Drop Workflow**:
  - Reorder **Task Cards** across status swimlanes or reorder within columns.
  - Reorder **Status Columns** freely via drag-and-drop or column navigation buttons (`◀`/`▶`).
- ⏱️ **Sprint Management**: Create, edit, and organize multiple sprints or manage the Product Backlog.
- ⚙️ **Custom Development Statuses**: Add, edit, recolor, and reorder custom SDLC statuses with instant persistence.
- 💬 **Daily Standup Generator**: Generate copy-pasteable daily standup summaries (Yesterday, Today, Blockers) with one click.
- 🎨 **Dark / Light Theme**: Built-in support for sleek dark and crisp light visual themes.
- 💾 **100% Offline & Private**: All data is securely stored locally on your machine with JSON Backup Import/Export.

---

## 🛠️ Development & Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- `npm`

### 1. Clone the repository
```bash
git clone https://github.com/munawaralimangat/sprintflow-desktop.git
cd sprintflow-desktop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run in development mode
```bash
npm start
```

### 4. Build Windows Installer (`.exe`)
```bash
npm run dist
```
The compiled installer will be generated in the `dist/` directory (e.g. `dist/SprintFlow Setup 1.0.0.exe`).

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
