import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const __dirname = path.resolve();
const STATIC_DIR = path.join(__dirname, 'MyProject_1', 'simple-notes');
const SCREENSHOT_PATH = path.join(__dirname, 'MyProject_1', 'asmetnotes_screenshot.png');
const ARTIFACT_DIR = 'C:\\Users\\Amani\\.gemini\\antigravity\\brain\\e480647a-0f41-4675-a36c-a0e95bc4b684';
const ARTIFACT_SCREENSHOT = path.join(ARTIFACT_DIR, 'asmetnotes_screenshot.png');

const PORT = 8000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function startServer() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(STATIC_DIR, reqPath);
    console.log(`[HTTP] ${req.method} ${req.url} -> exists: ${fs.existsSync(filePath)} (${filePath})`);

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`[Preview Server] Serving ${STATIC_DIR} on http://127.0.0.1:${PORT}`);
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`[Preview Server] Port ${PORT} already active; reusing existing server.`);
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

function getBrowserExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error('No compatible Chromium browser found.');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.pending = new Map();

    this.ready = new Promise((resolve, reject) => {
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.exceptionThrown') {
        console.error('[BROWSER EXCEPTION]:', JSON.stringify(msg.params.exceptionDetails));
      }
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log(`[BROWSER CONSOLE ${msg.params.type}]:`, ...msg.params.args.map(a => a.value || a.description));
      }
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    await this.ready;
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      throw new Error('Evaluation error: ' + JSON.stringify(res.exceptionDetails));
    }
    return res.result?.value;
  }
}

async function waitForHttp(url, timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for ${url}`);
}

async function main() {
  console.log('==================================================================');
  console.log('   AUTOMATED BROWSER TEST: ASMETNOTES V1.3 FEATURE VERIFICATION   ');
  console.log('==================================================================');

  const server = await startServer();
  const browserExe = getBrowserExecutable();
  console.log(`[Browser] Using browser: ${browserExe}`);

  const userDataDir = path.join(__dirname, '.browser-test-profile-' + Date.now());
  fs.mkdirSync(userDataDir, { recursive: true });

  const chromeProc = spawn(browserExe, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ], { stdio: 'ignore' });

  try {
    console.log('[Browser] Connecting to Chrome via CDP...');
    await waitForHttp('http://127.0.0.1:9222/json/version', 8000);

    const targets = await waitForHttp('http://127.0.0.1:9222/json/list', 5000);
    const pageTarget = targets.find(t => t.type === 'page') || targets[0];
    if (!pageTarget) throw new Error('No page target available');

    const cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    console.log('[Browser] Navigating to http://127.0.0.1:8000...');
    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:8000' });

    console.log('[Browser] Waiting for AsmetNotes app.js initialization...');
    const startWait = Date.now();
    let loaded = false;
    while (Date.now() - startWait < 10000) {
      loaded = await cdp.evaluate(`Boolean(window.__APP_LOADED__)`);
      if (loaded) break;
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!loaded) throw new Error('App failed to initialize within 10 seconds');
    console.log('[Browser] App fully initialized and rendered!');

    // TEST 1: Layout & Deduplication Audit (PRD §3 & §8)
    console.log('\n[Test 1] Verifying PRD Layout & Deduplication...');
    // PRD §8: These should NOT be in header (they are consolidated in settings/sidebar)
    const duplicateSettingsInHeader = await cdp.evaluate(`Boolean(document.querySelector('.app-header #settings-btn'))`);
    const duplicateCreateInSidebar = await cdp.evaluate(`Boolean(document.getElementById('sidebar-new-note-btn'))`);
    const duplicateExportInSidebar = await cdp.evaluate(`Boolean(document.getElementById('sidebar-export-btn'))`);
    const duplicateSettingsInBottom = await cdp.evaluate(`Boolean(document.getElementById('bottom-settings-btn'))`);
    // PRD §3 & §8: Clear All SHOULD be in header
    const clearAllInHeader = await cdp.evaluate(`Boolean(document.querySelector('.app-header #clear-all-btn'))`);
    // PRD §3: Strong confirmation dialog should exist
    const confirmDialogExists = await cdp.evaluate(`Boolean(document.getElementById('confirm-clear-dialog'))`);

    if (duplicateSettingsInHeader || duplicateCreateInSidebar || duplicateExportInSidebar || duplicateSettingsInBottom) {
      throw new Error(`Deduplication check failed! HeaderSettings=${duplicateSettingsInHeader}, SidebarCreate=${duplicateCreateInSidebar}, BottomSettings=${duplicateSettingsInBottom}`);
    }
    if (!clearAllInHeader) throw new Error('PRD §8: Clear All button missing from header');
    if (!confirmDialogExists) throw new Error('PRD §3: Strong confirmation dialog missing');
    console.log('  ✓ PRD §8: Clear All is in header, no duplicate icons elsewhere.');
    console.log('  ✓ PRD §3: Strong confirmation dialog exists for Clear All.');

    // TEST 2: Real Feature: Grid vs List View Toggle
    console.log('\n[Test 2] Testing Real Feature: Grid vs List View Mode...');
    const btnDiag = await cdp.evaluate(`(() => {
      const btn = document.getElementById('view-mode-btn');
      return {
        viewModeOnclick: typeof btn?.onclick,
        themeBtnOnclick: typeof document.getElementById('theme-toggle-btn')?.onclick,
        newNoteOnclick: typeof document.getElementById('new-note-btn')?.onclick,
        cancelBtnOnclick: typeof document.getElementById('cancel-btn')?.onclick,
        sidebarSettingsOnclick: typeof document.getElementById('sidebar-settings-btn')?.onclick,
        notesListClass: document.getElementById('notes-list')?.className
      };
    })()`);
    console.log('  Debug btnDiag:', JSON.stringify(btnDiag));

    const initialClasses = await cdp.evaluate(`document.getElementById('notes-list')?.className`);
    console.log(`  Initial notes-list className: "${initialClasses}"`);
    const btnExists = await cdp.evaluate(`Boolean(document.getElementById('view-mode-btn'))`);
    console.log(`  view-mode-btn exists: ${btnExists}`);

    await cdp.evaluate(`document.getElementById('view-mode-btn').click()`);
    await new Promise((r) => setTimeout(r, 400));
    const classesAfterClick1 = await cdp.evaluate(`document.getElementById('notes-list')?.className`);
    console.log(`  notes-list className after click 1: "${classesAfterClick1}"`);
    const isListView = await cdp.evaluate(`document.getElementById('notes-list').classList.contains('notes-grid--list-view')`);

    await cdp.evaluate(`document.getElementById('view-mode-btn').click()`);
    await new Promise((r) => setTimeout(r, 400));
    const classesAfterClick2 = await cdp.evaluate(`document.getElementById('notes-list')?.className`);
    console.log(`  notes-list className after click 2: "${classesAfterClick2}"`);
    const isGridView = !await cdp.evaluate(`document.getElementById('notes-list').classList.contains('notes-grid--list-view')`);
    if (!isListView || !isGridView) {
      throw new Error(`View mode toggle (Grid/List) failed. isListView=${isListView}, isGridView=${isGridView}`);
    }
    console.log('  ✓ View mode toggle (Grid vs List View) verified.');

    // TEST 3: Real Feature: Quick Theme Toggle
    console.log('\n[Test 3] Testing Real Feature: Quick Theme Switcher...');
    await cdp.evaluate(`document.getElementById('theme-toggle-btn').click()`);
    await new Promise((r) => setTimeout(r, 200));
    const themeAfterToggle = await cdp.evaluate(`document.documentElement.getAttribute('data-theme')`);
    if (!themeAfterToggle) throw new Error('Theme toggle failed to set data-theme attribute');
    console.log(`  Theme toggled to: "${themeAfterToggle}"`);
    console.log('  ✓ Quick theme toggle verified.');

    // TEST 4: Create Note with Tag, Color Accent & Real-Time Word Count
    console.log('\n[Test 4] Creating Note with Tag (#Work), Color Accent & Testing Word Count...');
    await cdp.evaluate(`document.getElementById('new-note-btn').click()`);
    await new Promise((r) => setTimeout(r, 200));

    // Choose Tag 'Work' and Color 'emerald'
    await cdp.evaluate(`(() => {
      document.querySelector('#note-tag-selector .tag-pill[data-value="Work"]')?.click();
      document.querySelector('#note-color-picker .color-dot[data-color="emerald"]')?.click();
      document.getElementById('note-title').value = 'Q4 Strategic Architecture';
      const contentInput = document.getElementById('note-content');
      contentInput.value = 'Designing high-performance decoupled frontend architecture with zero bloated dependencies and instant local persistence.';
      contentInput.dispatchEvent(new Event('input'));
    })()`);

    const wordCountText = await cdp.evaluate(`document.getElementById('editor-word-count')?.textContent`);
    console.log(`  Live editor word counter: "${wordCountText}"`);
    if (!wordCountText.includes('words') || !wordCountText.includes('chars')) {
      throw new Error(`Word counter failed: ${wordCountText}`);
    }

    await cdp.evaluate(`document.getElementById('editor-form').dispatchEvent(new Event('submit', { cancelable: true }))`);
    await new Promise((r) => setTimeout(r, 300));

    const card = await cdp.evaluate(`(() => {
      const c = document.querySelector('.note-card');
      return {
        hasEmeraldColor: c?.classList.contains('note-card--color-emerald'),
        tagText: c?.querySelector('.note-card__tag-chip')?.textContent,
        title: c?.querySelector('.note-card__title')?.textContent
      };
    })()`);

    console.log(`  Created card: Title="${card.title}", Tag="${card.tagText}", EmeraldAccent=${card.hasEmeraldColor}`);
    if (!card.hasEmeraldColor || card.tagText !== '#Work') {
      throw new Error(`Note card tag or color accent failed: ${JSON.stringify(card)}`);
    }
    console.log('  ✓ Note created with emerald color accent and #Work tag chip.');

    // TEST 5: Real Feature: Duplicate Note
    console.log('\n[Test 5] Testing Real Feature: Duplicate Note Action...');
    await cdp.evaluate(`(() => {
      const dupBtn = document.querySelector('.note-card button[data-action="duplicate"]');
      dupBtn?.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));

    const totalCardsAfterDup = await cdp.evaluate(`document.querySelectorAll('.note-card').length`);
    const titlesAfterDup = await cdp.evaluate(`Array.from(document.querySelectorAll('.note-card')).map(c => c.querySelector('.note-card__title')?.textContent)`);
    console.log(`  Total cards after duplicate: ${totalCardsAfterDup}, Titles:`, JSON.stringify(titlesAfterDup));
    const hasCopy = titlesAfterDup.some(t => t && t.includes('(Copy)'));
    if (totalCardsAfterDup !== 2 || !hasCopy) {
      throw new Error(`Duplicate note failed. Count: ${totalCardsAfterDup}, Titles: ${JSON.stringify(titlesAfterDup)}`);
    }
    console.log('  ✓ Duplicate note functionality verified.');

    // TEST 6: Real Feature: Sidebar Tag Filtering
    console.log('\n[Test 6] Testing Real Feature: Sidebar Tag Navigation Filter...');
    // Create a Personal note
    await cdp.evaluate(`(() => {
      document.getElementById('new-note-btn').click();
      document.querySelector('#note-tag-selector .tag-pill[data-value="Personal"]')?.click();
      document.getElementById('note-title').value = 'Weekend Biking Route';
      document.getElementById('note-content').value = 'Prepare trail map and hydration pack.';
      document.getElementById('editor-form').dispatchEvent(new Event('submit', { cancelable: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));

    // Filter by #Personal tag
    await cdp.evaluate(`document.querySelector('.sidebar-tag-item[data-tag="Personal"]')?.click()`);
    await new Promise((r) => setTimeout(r, 200));

    const personalVisibleCount = await cdp.evaluate(`document.querySelectorAll('.note-card').length`);
    const personalCardTag = await cdp.evaluate(`document.querySelector('.note-card .note-card__tag-chip')?.textContent`);
    console.log(`  Personal tag filter: ${personalVisibleCount} card visible (Tag: ${personalCardTag})`);
    if (personalVisibleCount !== 1 || personalCardTag !== '#Personal') {
      throw new Error(`Tag filtering failed. Count: ${personalVisibleCount}, Tag: ${personalCardTag}`);
    }

    // Reset tag filter to All Tags
    await cdp.evaluate(`document.querySelector('.sidebar-tag-item[data-tag="all"]')?.click()`);
    await new Promise((r) => setTimeout(r, 200));
    const allVisibleCount = await cdp.evaluate(`document.querySelectorAll('.note-card').length`);
    console.log(`  Reset to All Tags: ${allVisibleCount} cards visible`);
    if (allVisibleCount !== 3) throw new Error(`Expected 3 cards, got ${allVisibleCount}`);
    console.log('  ✓ Sidebar category & tag filtering verified.');

    // TEST 7: Real Feature: Storage Breakdown Details Modal
    console.log('\n[Test 7] Testing Real Feature: Storage Breakdown Details Modal...');
    await cdp.evaluate(`document.getElementById('storage-details-trigger').click()`);
    await new Promise((r) => setTimeout(r, 300));
    const storageModalOpen = await cdp.evaluate(`document.getElementById('storage-dialog')?.open`);
    const breakdownKeysCount = await cdp.evaluate(`document.querySelectorAll('#storage-keys-list .storage-key-row').length`);
    console.log(`  Storage dialog open: ${storageModalOpen}, Keys listed: ${breakdownKeysCount}`);
    if (!storageModalOpen || breakdownKeysCount === 0) {
      throw new Error('Storage details dialog failed to open or show key breakdown.');
    }
    await cdp.evaluate(`document.getElementById('storage-dialog-close-btn').click()`);
    console.log('  ✓ Storage details breakdown modal verified.');

    // TEST 8: PRD §3: Clear All with Strong Two-Step Confirmation
    console.log('\n[Test 8] Testing PRD §3: Clear All with Strong Confirmation Dialog...');
    await cdp.evaluate(`document.getElementById('clear-all-btn').click()`);
    await new Promise((r) => setTimeout(r, 300));
    const dialogOpen = await cdp.evaluate(`document.getElementById('confirm-clear-dialog')?.open`);
    if (!dialogOpen) throw new Error('PRD §3: Confirmation dialog did not open on Clear All click');

    // Verify button is disabled until "DELETE" is typed
    const btnDisabledBefore = await cdp.evaluate(`document.getElementById('confirm-clear-ok-btn').disabled`);
    if (!btnDisabledBefore) throw new Error('PRD §3: Delete button should be disabled before typing DELETE');

    // Type DELETE to enable button
    await cdp.evaluate(`(() => {
      const input = document.getElementById('confirm-clear-input');
      input.value = 'DELETE';
      input.dispatchEvent(new Event('input'));
    })()`);
    await new Promise((r) => setTimeout(r, 100));
    const btnEnabledAfter = await cdp.evaluate(`!document.getElementById('confirm-clear-ok-btn').disabled`);
    if (!btnEnabledAfter) throw new Error('PRD §3: Delete button should be enabled after typing DELETE');

    // Cancel instead (don't actually clear notes for downstream tests)
    await cdp.evaluate(`document.getElementById('confirm-clear-cancel-btn').click()`);
    await new Promise((r) => setTimeout(r, 100));
    const dialogClosed = await cdp.evaluate(`!document.getElementById('confirm-clear-dialog')?.open`);
    if (!dialogClosed) throw new Error('PRD §3: Dialog should close on Cancel');
    console.log('  ✓ PRD §3: Clear All strong two-step confirmation verified (open → type DELETE → enable → cancel).');

    // TEST 9: Capture High-Res Viewport Screenshot of Cleaned UI
    console.log('\n[Test 9] Capturing Viewport Screenshot of the Upgraded AsmetNotes...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1366,
      height: 850,
      deviceScaleFactor: 2,
      mobile: false
    });

    const screenshotData = await cdp.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(screenshotData.data, 'base64');
    fs.writeFileSync(SCREENSHOT_PATH, buffer);
    if (fs.existsSync(ARTIFACT_DIR)) {
      fs.writeFileSync(ARTIFACT_SCREENSHOT, buffer);
    }
    console.log(`  ✓ Screenshot saved: ${SCREENSHOT_PATH} (${buffer.length} bytes)`);

    console.log('\n==================================================================');
    console.log('   ALL 9 PRD & FEATURE BROWSER TESTS PASSED!                      ');
    console.log('==================================================================');

  } finally {
    console.log('[Cleanup] Terminating headless browser process...');
    chromeProc.kill('SIGTERM');
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch (_) {}

    if (server) {
      console.log('[Preview Server] Keeping preview server active on port 8000.');
    }
  }
}

main().catch((err) => {
  console.error('\n[TEST FAILED]:', err);
  process.exit(1);
});
