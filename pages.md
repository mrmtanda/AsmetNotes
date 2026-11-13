# Pages & Screen Specifications: Simple Notes

This document defines all the screens, views, and modal states required for **Simple Notes**, based on [`prd.md`](./prd.md) and [`architecture.md`](./architecture.md). Each section includes a structural breakdown and a **copy-paste ready prompt tailored for Google Stitch** (or other AI UI generation tools) to generate pixel-perfect, modern UI designs.

---

## Navigation & UI State Flow Map

Even though Simple Notes is implemented as a client-side Single Page Application (SPA), it consists of 6 distinct UI screens and modal states:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        1. Main Dashboard                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Header: Brand | Search | Sort Dropdown | + New Note | Clear All   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│         │                                        │                     │
│         ├─ [No Notes in Storage] ───────────────►│ 2. Empty State      │
│         │                                        │                     │
│         ├─ [Search Yields 0 Matches] ───────────►│ 3. No Search Match  │
│         │                                        │                     │
│         ├─ [Click "+ New Note" or "Edit"] ──────►│ 4. Note Editor Modal│
│         │                                        │                     │
│         ├─ [Click "Delete" or "Clear All"] ─────►│ 5. Confirm Dialog   │
│         │                                        │                     │
│         └─ [Mobile Viewport (< 640px)] ─────────►│ 6. Mobile Layout    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Page 1: Main Notes Dashboard (Populated State)

### Purpose & Context
The primary landing view when the user has saved notes. Displays the top navigation, search/filter toolbar, pinned notes section, and a responsive CSS grid of note cards.

### Key Elements & Components
1. **App Header**:
   - Brand logo / app icon (minimalist notepad/quill icon) and title: `Simple Notes`.
   - Real-time search bar with search icon and quick clear button (`✕`).
   - Sort dropdown: `Newest First` (default), `Oldest First`, `Title (A–Z)`.
   - Primary action button: `+ New Note` (prominent accent color).
   - Secondary / Destructive action button: `Clear All` (subtle red outline or ghost button).
2. **Stats / Filter Bar**:
   - Count indicator (e.g., "Showing 8 notes" or "2 pinned").
3. **Notes Grid (Responsive 2 to 4 columns)**:
   - **Pinned Notes Group**: Highlighted section with subtle pin header or badge.
   - **Note Card Component**:
     - Card header: Note Title (bold, single-line truncated with ellipsis).
     - Pin button icon (active/filled pin for pinned notes, hollow for unpinned).
     - Body preview: Truncated text up to 3 lines (clean typographic line-clamp).
     - Card footer: Formatted timestamp (`Updated Nov 5, 2:30 PM`).
     - Actions: Subtle hover action row with `Edit` (pencil icon) and `Delete` (trash can icon).

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design a clean, modern, and minimalist web dashboard for a browser-based note-taking application named "Simple Notes".

Layout & Structure:
- Top Header: A sleek horizontal navigation bar featuring a minimalist notebook logo and the bold title "Simple Notes" on the left. In the center, include a rounded search input bar with a magnifying glass icon and placeholder "Search notes...". On the right side, place a sort dropdown menu ("Newest first", "Oldest first", "Title A–Z"), a subtle ghost red "Clear All" button, and a prominent solid primary button "+ New Note".
- Content Area: Max width 1200px, centered with generous padding.
- Notes Grid: Responsive multi-column grid (3-4 cards per row on desktop).
- Note Cards: Modern elevated cards with soft borders (1px solid #E2E8F0), rounded corners (12px), subtle hover drop shadow, and clean whitespace.
  * Each card has a bold title (18px, font-weight 600).
  * A pin icon toggle button in the top-right corner of the card (gold/accent color when active).
  * A 3-line truncated body preview in muted text (#4A5568, 14px, line-height 1.6).
  * Card footer containing a subtle timestamp (e.g., "Updated 2 hours ago") on the left and quick action buttons (Edit pencil icon and Delete trash icon) on the right.
- Distinct visual separation or badge for "Pinned Notes" at the top of the grid.

Style & Aesthetics:
- Aesthetic: Notion / Apple Notes inspired clean aesthetic. Minimalist, distraction-free, light theme with soft slate/neutral gray backgrounds (#F8FAFC) and pure white card surfaces (#FFFFFF).
- Accent Color: Calming Indigo/Slate Blue (#4F46E5).
- Typography: Clean sans-serif system font (Inter or system-ui).
```

---

## Page 2: Empty State (Zero Notes Screen)

### Purpose & Context
Displayed when the user first opens the application with an empty `localStorage`, or immediately after invoking "Clear All". It educates the user on app functionality and encourages immediate note creation.

### Key Elements & Components
1. **App Header**: Same standard header with search and sort, but `Clear All` is disabled or hidden.
2. **Hero Empty State Illustration**:
   - Clean, lightweight vector illustration or minimalist icon (e.g., a stylized folded paper sheet, floating pen, or empty desk graphic).
3. **Encouraging Typography**:
   - Primary Headline: `No notes yet` or `Your thoughts start here`.
   - Subtext: `Capture ideas, make checklists, or draft quick notes. Everything is saved automatically and securely inside your browser.`
4. **Primary Call to Action (CTA)**:
   - Large, clickable button: `+ Create Your First Note`.
5. **Feature Highlights Badge / Mini Footnote**:
   - 3 subtle feature pills below the button: `🔒 100% Private (No Cloud)` · `⚡ Instant Offline Access` · `💾 Auto-Saved`.

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design an inviting, polished empty state screen for the "Simple Notes" web application.

Layout & Structure:
- Standard top navigation header: "Simple Notes" brand title on the left, an inactive/disabled search bar in the middle, and a disabled "Clear All" button.
- Main Body: Centered flexbox layout with maximum vertical and horizontal centering.
- Illustration: In the center, display a beautiful, modern minimalist line-art illustration or 3D clay-style icon of an open notebook with a gentle pencil or folded blank memo pad.
- Headline & Text:
  * Heading 2: "No notes yet" in clean, dark slate typography (24px, semi-bold).
  * Subtitle: "Jot down ideas, to-do lists, and snippets. Your notes stay completely private and auto-saved in your browser." (15px, muted gray, max-width 440px, centered).
- Primary Call to Action:
  * A large, friendly primary button: "+ Create Your First Note" with rounded corners (8px), vibrant indigo background (#4F46E5), white text, and a soft hover glow.
- Trust Indicators:
  * Beneath the button, display three subtle pill badges with small icons: "Private & Local", "Works Offline", and "Auto-Saved".

Style & Aesthetics:
- Minimalist, friendly, airy white and soft pastel gray palette (#F8FAFC).
- High visual polish with balanced typography and ample breathing room.
```

---

## Page 3: Search & Filter (No Results State)

### Purpose & Context
Triggered dynamically when a user types a query in the search input that doesn't match any note titles or contents.

### Key Elements & Components
1. **Header with Active Search Bar**:
   - Search input contains user's search text (e.g. `"quarterly budget"`).
   - Clear icon (`✕`) visibly active inside the search input.
2. **Search Feedback Header**:
   - Subtle status text: `0 results for "quarterly budget"`.
3. **No Results Content Card**:
   - Minimalist search-with-question-mark or magnifying glass illustration.
   - Headline: `No matching notes found`.
   - Subtitle: `We couldn't find anything matching your search. Check for typos or try different keywords.`
   - Action Button: Secondary ghost button `Clear Search Filter`.

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design a "No Search Results" state for the "Simple Notes" web app.

Layout & Structure:
- Top Header: The search input bar is actively focused with sample search text "meeting notes" and an active "✕" clear button icon on the right side of the input.
- Results Status: Just beneath the header, display a subtle text label: "Showing 0 results for 'meeting notes'".
- Central Empty Feedback Box:
  * An icon of a magnifying glass over an empty sheet of paper in soft muted indigo/gray.
  * Heading: "No matching notes found" (20px, font-weight 600, color #1E293B).
  * Supporting sentence: "We couldn't find any note matching your search query. Try checking your spelling or clear your query." (14px, color #64748B).
  * Button: A clean secondary outline button "Clear Search Filter" that resets the search box.

Style & Aesthetics:
- Maintain consistent clean UI with soft background (#F8FAFC), sans-serif typography, and subtle rounded border styling.
```

---

## Page 4: Note Editor Modal / Dialog View

### Purpose & Context
The creation and editing surface triggered by clicking `+ New Note`, clicking an existing note card, or clicking `Edit`. Implemented using the native HTML5 `<dialog>` element with an accessible backdrop overlay.

### Key Elements & Components
1. **Backdrop Scrim**:
   - Translucent darkened background overlay with subtle blur (`backdrop-filter: blur(4px); background: rgba(0, 0, 0, 0.4)`).
2. **Dialog Container**:
   - Centered modal container (`width: min(90vw, 640px)`), smooth entrance animation, rounded corners (16px).
3. **Dialog Header**:
   - Modal title: `Create New Note` (or `Edit Note` when updating).
   - Dismiss button: Top-right `✕` icon button.
4. **Form Inputs**:
   - **Title Input**:
     - Large, clean input field with placeholder: `Note Title...`
     - Character counter indicator: `0 / 100` characters.
     - Required field indicator / validation styling.
   - **Content Textarea**:
     - Multi-line textarea (min 8 rows, auto-expanding feel).
     - Placeholder: `Write your note content here...`
     - Word & Character live count indicator in the bottom corner (e.g., `42 words · 210 characters`).
5. **Metadata Bar (If Editing)**:
   - Subtle timestamp info: `Last edited: Today at 2:15 PM`.
6. **Dialog Action Buttons**:
   - `Cancel` button: Secondary/ghost button (closes modal without saving).
   - `Save Note` button: Primary solid button (with keyboard hint: `Ctrl+Enter` / `Cmd+Enter`).

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design a modern, distraction-free modal dialog for creating and editing notes in the "Simple Notes" web application.

Layout & Structure:
- Modal Dialog overlaid on top of a softly blurred, darkened background dashboard.
- Dialog Box:
  * Centered on the screen, width 640px, rounded corners (16px), crisp white background (#FFFFFF), and prominent elevation shadow (0 20px 25px -5px rgba(0,0,0,0.1)).
  * Header: Title text "Edit Note" (or "Create New Note") in 20px semi-bold slate, with a subtle circular close button ("✕") on the top right.
- Input Fields:
  * Note Title Field: Frameless or subtly bordered input with large text (20px, font-weight 600), placeholder "Note title...", with a small character counter "24/100" aligned on the right.
  * Note Body Field: Large, comfortable textarea (minimum height 260px) with clean typography (15px, line-height 1.6), placeholder "Type your thoughts here...".
  * Field Divider: Thin horizontal separator (#F1F5F9).
- Modal Footer:
  * Left side: Small metadata text showing "Last updated: Nov 5, 2026, 2:30 PM" and a live word count "128 words".
  * Right side: Two action buttons:
    1. "Cancel" secondary ghost button.
    2. "Save Note" solid primary button (#4F46E5) with a subtle keyboard shortcut badge "⌘ Enter" inside or next to it.

Style & Aesthetics:
- Clean, focused writing interface inspired by Notion, Bear, and Apple Notes. High contrast, readable, zero visual clutter.
```

---

## Page 5: Destructive Confirmation Dialogs (Delete & Clear All)

### Purpose & Context
Security and safety dialogs to prevent accidental data loss. Triggered when the user clicks `Delete` on an individual card or `Clear All` in the main toolbar.

### Key Elements & Components
1. **Single Note Delete Confirmation Modal**:
   - Warning badge / Icon: Circular soft amber/red background with a warning triangle or trash icon.
   - Title: `Delete Note?`
   - Description: `Are you sure you want to delete "[Note Title]"? This action cannot be undone.`
   - Actions: `Cancel` (ghost) and `Delete Note` (solid red danger button `#EF4444`).
2. **Clear All Notes Critical Warning Modal**:
   - Critical Danger Icon: Pulsing red shield or trash icon.
   - Title: `Clear All Notes?`
   - Description: `This will permanently remove all [X] notes from your browser's local storage. You will lose all unsaved ideas.`
   - Actions: `Cancel` (secondary) and `Yes, Clear Everything` (prominent danger button).

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design two variants of a destructive confirmation alert dialog modal for the "Simple Notes" web app.

Variant A: "Delete Single Note Confirmation"
- Compact centered modal dialog (width 420px, rounded 14px, white background).
- Visual Icon: Soft red circular badge at the top left containing a red trash icon.
- Content:
  * Title: "Delete Note" (18px, bold, #0F172A).
  * Description: "Are you sure you want to delete 'Grocery List'? This note will be permanently removed from your storage." (14px, color #64748B).
- Action Buttons (Right-aligned in footer):
  * "Cancel" (neutral border button).
  * "Delete" (solid crimson danger button, #DC2626).

Variant B: "Clear All Notes Warning"
- Modal with prominent critical danger styling.
- Header with red warning triangle icon and title "Clear All Notes?".
- Warning box with light red background (#FEF2F2), red border (#FCA5A5), and warning text: "Warning: This action will delete all 14 saved notes in your browser. This cannot be undone."
- Buttons: "Keep My Notes" (primary neutral) and "Clear All Notes" (destructive red).

Style & Aesthetics:
- High-trust, clear UX design preventing accidental clicks. Clear visual hierarchy with obvious cancellation options.
```

---

## Page 6: Mobile Web Layout (Handheld Viewport)

### Purpose & Context
Responsive representation of Simple Notes on mobile devices (< 640px viewport width, iPhone / Android).

### Key Elements & Components
1. **Compact Mobile Header**:
   - App title on the left.
   - Search icon button (toggles full-width search input).
   - Overflow menu (`⋮`) for "Clear All" and sorting options.
2. **Single-Column Card Feed**:
   - Full-width touch-friendly cards with comfortable padding (16px).
   - Easily tappable pin, edit, and delete icons with generous touch targets (minimum 44x44px).
3. **Floating Action Button (FAB)**:
   - Fixed at bottom-right of viewport: round 56x56px button with `+` icon, solid indigo with strong elevation shadow for easy thumb reach.
4. **Mobile Bottom Sheet Editor**:
   - When editing/creating, editor opens as a slide-up bottom sheet occupying 90% screen height with sticky Save/Cancel bar.

---

### Google Stitch Prompt (Copy & Paste Ready)

```text
Design a mobile viewport (390x844px, iPhone frame) for the "Simple Notes" web application.

Layout & Structure:
- Mobile Navigation Bar: Top sticky app bar with "Simple Notes" title, a search glass icon that expands an input, and a 3-dot overflow menu for "Sort" and "Clear All".
- Scrollable Card Feed: Single-column list of note cards with touch-friendly spacing:
  * Cards have rounded corners (12px), subtle border, and card padding.
  * High-contrast typography with bold titles, 2-line snippet preview, and timestamp.
  * Direct icon buttons on card bottom right: Pin toggle, Edit, and Delete with 44px touch targets.
- Floating Action Button (FAB):
  * Prominent circular button (56x56px) positioned at bottom-right (24px margin from edges).
  * Vibrant indigo background (#4F46E5) with a white "+" plus icon and soft floating drop shadow.
- Mobile Note Editor State (Slide-up Bottom Sheet):
  * Clean bottom sheet covering 90% of screen height with a grab handle at the top.
  * Fixed top action bar with "Cancel" on left, "Edit Note" title center, and "Save" button in bold indigo on the right.
  * Full-width responsive inputs for note title and content.

Style & Aesthetics:
- Native iOS / Android feel, modern mobile web design, thumb-accessible layout, clean neutral background.
```

---

## Design System Tokens for Stitch Reference

When inputting these prompts or adjusting styling in Google Stitch, use these unified design tokens:

| Token Category | Values |
|---|---|
| **Primary Accent** | `#4F46E5` (Indigo-600), Hover: `#4338CA` |
| **Danger / Destructive** | `#DC2626` (Red-600), Light BG: `#FEF2F2` |
| **Neutral Backgrounds** | Page: `#F8FAFC`, Surface/Card: `#FFFFFF`, Dialog: `#FFFFFF` |
| **Dark Mode Backgrounds** | Page: `#0F172A`, Surface/Card: `#1E293B`, Borders: `#334155` |
| **Text Colors** | Headings: `#0F172A`, Body: `#334155`, Muted/Timestamps: `#64748B` |
| **Card Borders & Radii** | Border: `1px solid #E2E8F0`, Radius: `12px` (Cards), `16px` (Dialogs) |
| **Typography** | Font Family: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| **Shadows** | Cards: `0 1px 3px rgba(0,0,0,0.05)`, Modals: `0 20px 25px -5px rgba(0,0,0,0.1)` |

