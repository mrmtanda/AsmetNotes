# AsmetNotes 📝

A modern, fast, and secure note-taking web application with private cloud synchronization powered by Supabase and PostgreSQL Row Level Security (RLS).

---

## 🛠️ Tech Stack & Architecture

### Core Technologies

<p align="left">
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" alt="JavaScript" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://www.w3.org/html/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" alt="HTML5" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://www.w3schools.com/css/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" alt="CSS3" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://supabase.com" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/supabase/supabase-original.svg" alt="Supabase" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://www.postgresql.org" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" alt="PostgreSQL" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://nodejs.org" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" alt="Node.js" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://git-scm.com/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" alt="Git" width="48" height="48"/>
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;
  <a href="https://github.com/" target="_blank" rel="noreferrer">
    <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/github/github-original.svg" alt="GitHub" width="48" height="48"/>
  </a>
</p>

### Technology Breakdown

| Logo | Technology | Role | Description |
| :---: | :--- | :--- | :--- |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-original.svg" width="32" height="32" alt="JavaScript"/> | **JavaScript (ES Modules)** | Frontend Logic | Native vanilla ES6+ client-side application logic, state stores, and SPA router. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" width="32" height="32" alt="HTML5"/> | **HTML5** | Structure & Semantics | Accessible semantic markup, native dialog modals, and metadata. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" width="32" height="32" alt="CSS3"/> | **CSS3 & Design Tokens** | Presentation & Themes | Responsive layouts, CSS variables, glassmorphism, and dual light/dark themes. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/supabase/supabase-original.svg" width="32" height="32" alt="Supabase"/> | **Supabase** | Backend-as-a-Service | Real-time database client, JWT session handling, and cloud authentication. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/postgresql/postgresql-original.svg" width="32" height="32" alt="PostgreSQL"/> | **PostgreSQL 17** | Relational Database | Strict Row Level Security (RLS), full-text search `tsvector` with GIN indexing. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nodejs/nodejs-original.svg" width="32" height="32" alt="Node.js"/> | **Node.js** | Local Preview Server | Lightweight built-in HTTP server with clean routing and extensionless URLs. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/git/git-original.svg" width="32" height="32" alt="Git"/> | **Git** | Version Control | Source code revision tracking and branch management. |
| <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/github/github-original.svg" width="32" height="32" alt="GitHub Pages"/> | **GitHub & GitHub Pages** | Code Repository & Host | Cloud repository hosting and production deployment. |

```
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-5FA04E?style=for-the-badge&logo=node.js&logoColor=white)
```

---

## ✨ Features

- **Click to Read & Edit**: Click anywhere on a note card to open and read its full content inside the editor dialog.
- **Private & Multi-User Isolation**: Built with strict PostgreSQL Row Level Security (RLS) policies — each user can only read, write, and manage their own notes.
- **Supabase Cloud Sync**: Instant persistent synchronization for notes, tags, and workspace settings.
- **Full-Text Search (FTS)**: Lightning-fast search across titles, note content, and categories using PostgreSQL generated `tsvector` columns with GIN indexing.
- **Categorization & Tagging**: Organize notes with custom categories (`Work`, `Personal`, `Ideas`, `Todo`) and color accents.
- **Dual Theme Support**: Beautiful light and dark modes with system preference auto-detection.
- **Clean Authentication**: Modern, distraction-free sign-in and sign-up with instant account activation.
- **Clean URL Router**: Extensionless URLs (`/` and `/auth`) without `.html` paths.
- **Responsive Layout**: Designed for seamless use across desktop, tablet, and mobile browsers.

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/mrmtanda/AsmetNotes.git
cd AsmetNotes
```

### 2. Run the Local Preview Server
You can serve the application with the Node.js built-in HTTP server:
```bash
node server.mjs
```
Then open your browser at:
- **Main Dashboard**: [http://localhost:3000/](http://localhost:3000/)
- **Sign In / Sign Up**: [http://localhost:3000/auth](http://localhost:3000/auth)

---

## 🗄️ Database Setup

The database schema and policies are defined in [`schema.sql`](./schema.sql).

Tables:
- `public.profiles`: User workspace settings and preferences.
- `public.tags`: User-defined categories with custom colors.
- `public.notes`: Notes storage with title, markdown body, tags, colors, and full-text search.
- `public.note_tags`: Relational junction table for many-to-many note tagging.

---

## 📄 License

MIT License. Built with ❤️ for productivity.
