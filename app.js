const $ = (id) => document.getElementById(id);
let running = false;
let serverCount = 1;
let startedAt = null;
let uptimeTimer = null;

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2600);
}
function updateServerState() {
  const status = $('serverStatus');
  const button = $('powerBtn');
  status.textContent = running ? '● Online' : '● Offline';
  status.className = running ? 'pill running' : 'pill stopped';
  button.textContent = running ? '■ Stop' : '▶ Start';
  button.classList.toggle('stop', running);
  $('players').textContent = running ? '0 / 20' : '0 / 20';
  if (!running) $('uptime').textContent = '—';
}
$('powerBtn').addEventListener('click', () => {
  running = !running;
  if (running) {
    startedAt = Date.now();
    $('uptime').textContent = '00:00:00';
    uptimeTimer = setInterval(() => {
      if (!running) return;
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      const h = String(Math.floor(seconds / 3600)).padStart(2,'0');
      const m = String(Math.floor(seconds % 3600 / 60)).padStart(2,'0');
      const s = String(seconds % 60).padStart(2,'0');
      $('uptime').textContent = `${h}:${m}:${s}`;
    }, 1000);
    toast('Demo server started (no real server connected).');
  } else {
    clearInterval(uptimeTimer);
    toast('Demo server stopped.');
  }
  updateServerState();
});
$('copyAddress').addEventListener('click', async () => {
  const address = $('serverAddress').textContent;
  try { await navigator.clipboard.writeText(address); toast('Demo address copied.'); }
  catch { toast(address); }
});
$('createBtn').addEventListener('click', () => $('createModal').hidden = false);
$('modalClose').addEventListener('click', () => $('createModal').hidden = true);
$('createModal').addEventListener('click', e => { if (e.target === $('createModal')) $('createModal').hidden = true; });
$('confirmCreate').addEventListener('click', () => {
  const name = $('newServerName').value.trim();
  if (!name) return toast('Please enter a server name.');
  $('serverName').textContent = name;
  $('serverCount').textContent = String(++serverCount);
  $('createModal').hidden = true;
  running = false;
  updateServerState();
  toast('Demo server created. Connect a backend to provision it for real.');
});
$('noticeClose').addEventListener('click', () => document.querySelector('.notice').remove());
$('refreshBtn').addEventListener('click', () => toast('Preview refreshed.'));
$('moreBtn').addEventListener('click', () => toast('More server actions will be available when the backend is connected.'));
$('openConsole').addEventListener('click', () => toast('Console UI is planned for the next build.'));
$('openSettings').addEventListener('click', () => toast('Settings UI is planned for the next build.'));
$('menuBtn').addEventListener('click', () => $('sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  button.classList.add('active');
  const page = button.dataset.page;
  if (page !== 'overview') toast(`${page[0].toUpperCase()+page.slice(1)} section is a placeholder in this preview.`);
  $('sidebar').classList.remove('open');
}));
