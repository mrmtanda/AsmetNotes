# AsmetNotes 📝

A modern, fast, and secure note-taking web application with private cloud synchronization powered by Supabase and PostgreSQL Row Level Security (RLS).

---

## ✨ Features

- **Private & Multi-User Isolation**: Built with strict PostgreSQL Row Level Security (RLS) policies — each user can only read, write, and manage their own notes.
- **Supabase Cloud Sync**: Instant persistent synchronization for notes, tags, and workspace settings.
- **Full-Text Search (FTS)**: Lightning-fast search across titles, note content, and categories using PostgreSQL generated `tsvector` columns with GIN indexing.
- **Categorization & Tagging**: Organize notes with custom categories (`Work`, `Personal`, `Ideas`, `Todo`) and color accents.
- **Dual Theme Support**: Beautiful light and dark modes with system preference auto-detection.
- **Clean Authentication**: Modern, distraction-free sign-in and sign-up with instant account activation.
- **Responsive Layout**: Designed for seamless use across desktop, tablet, and mobile browsers.

---

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES Modules), HTML5, CSS3 (Custom Design Tokens)
- **Database & Backend**: [Supabase](https://supabase.com/) (PostgreSQL 17)
- **Security**: PostgreSQL Row Level Security (RLS), Initplan Subquery Optimization
- **Typography & Icons**: Inter Font, Material Symbols Outlined, Native SVGs

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/mrmtanda/AsmetNotes.git
cd AsmetNotes
```

### 2. Run the Local Preview Server
You can serve the static files with Node.js built-in HTTP server:
```bash
node server.mjs
```
Then open your browser at:
- **Main App**: [http://localhost:3000/](http://localhost:3000/)
- **Sign In / Sign Up**: [http://localhost:3000/auth.html](http://localhost:3000/auth.html)

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

