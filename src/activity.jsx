/* ========================================================================
   ACTIVITY TRACKER — records what users do, where, and when.
   Persists to localStorage so the admin Activity log survives reloads.
   ======================================================================== */

const ACTIVITY_KEY = 'bgclub_activity_log';
const ACTIVITY_MAX = 500;
const activitySubs = new Set();

function readActivities() {
  try {
    const raw = localStorage.getItem(ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function writeActivities(list) {
  try {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(list));
  } catch (e) {}
  activitySubs.forEach(fn => { try { fn(list); } catch (e) {} });
}

function trackActivity(type, payload = {}) {
  const entry = {
    id: 'a_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
    ts: Date.now(),
    type,
    user: payload.user || null,
    role: payload.role || null,
    where: payload.where || null,
    details: payload.details || {},
  };
  const next = [entry, ...readActivities()].slice(0, ACTIVITY_MAX);
  writeActivities(next);
  return entry;
}

function clearActivities() {
  writeActivities([]);
}

function subscribeActivities(fn) {
  activitySubs.add(fn);
  return () => activitySubs.delete(fn);
}

function useActivities() {
  const [list, setList] = useState(readActivities);
  useEffect(() => {
    const unsub = subscribeActivities(setList);
    const onStorage = (e) => { if (e.key === ACTIVITY_KEY) setList(readActivities()); };
    window.addEventListener('storage', onStorage);
    return () => { unsub(); window.removeEventListener('storage', onStorage); };
  }, []);
  return list;
}

const ACTIVITY_LABELS = {
  login:                  { label: 'Signed in',         tone: 'ok' },
  login_failed:           { label: 'Failed sign-in',    tone: 'warn' },
  signup:                 { label: 'Registered',        tone: 'ok' },
  logout:                 { label: 'Signed out',        tone: 'mute' },
  view_change:            { label: 'Navigated',         tone: 'mute' },
  balance_adjust:         { label: 'Balance adjusted',  tone: 'ok' },
  tweak_change:            { label: 'Settings changed', tone: 'mute' },
  play_click:             { label: 'Clicked Play',      tone: 'mute' },
  deposit:                { label: 'Deposit',           tone: 'ok' },
  withdraw:               { label: 'Withdraw',          tone: 'warn' },
  admin_credit:           { label: 'Admin credit',      tone: 'ok' },
  admin_debit:            { label: 'Admin debit',       tone: 'warn' },
  payment_method_add:     { label: 'Payment method +',  tone: 'mute' },
  payment_method_remove:  { label: 'Payment method −',  tone: 'mute' },
  bonus_grant:            { label: 'Bonus granted',     tone: 'ok' },
  house_edge_change:      { label: 'House edge changed', tone: 'warn' },
  blackjack_round:        { label: 'Blackjack round',   tone: 'mute' },
};

function formatActivityTime(ts) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  return d.toLocaleString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function describeActivity(a) {
  switch (a.type) {
    case 'login':          return `Logged in as ${a.role || 'user'}`;
    case 'login_failed':   return `Failed login attempt for "${a.details.attempted || '—'}"`;
    case 'signup':         return `Created new account`;
    case 'logout':         return `Logged out`;
    case 'view_change':    return `Moved from ${a.details.from || '—'} → ${a.details.to || '—'}`;
    case 'balance_adjust': return `${a.details.amount >= 0 ? '+' : ''}${a.details.amount} on @${a.details.target}`;
    case 'tweak_change':   return `${a.details.key}: ${a.details.value}`;
    case 'play_click':     return `Clicked Play from landing`;
    case 'deposit':        return `+${a.details.amount} via ${a.details.method || a.details.methodType || '—'}`;
    case 'withdraw':       return `−${a.details.amount} via ${a.details.method || a.details.methodType || '—'}`;
    case 'admin_credit':   return `+${a.details.amount} → @${a.details.target}${a.details.reason ? ` · ${a.details.reason}` : ''}`;
    case 'admin_debit':    return `${a.details.amount} → @${a.details.target}${a.details.reason ? ` · ${a.details.reason}` : ''}`;
    case 'payment_method_add':    return `Added ${a.details.summary || a.details.type}`;
    case 'payment_method_remove': return `Removed ${a.details.summary || a.details.type}`;
    case 'bonus_grant':           return `+${a.details.amount} → @${a.details.target} · ${a.details.template || 'custom'}${a.details.message ? ` · "${a.details.message}"` : ''}`;
    case 'house_edge_change':     return `${a.details.enabled ? 'Enabled' : 'Disabled'} · strength ${Math.round((a.details.strength || 0) * 100)}%`;
    case 'blackjack_round':       {
      const stake = a.details.stake || 0;
      const main = a.details.mainNet || 0;
      const verb = a.details.kind === 'blackjack' ? 'BJ'
                 : a.details.kind === 'win'        ? 'Win'
                 : a.details.kind === 'lose'       ? 'Lose'
                 : a.details.kind === 'push'       ? 'Push'
                 : a.details.kind || '—';
      return `${verb} · stake ${stake} · ${main >= 0 ? '+' : ''}${main}`;
    }
    default:               return a.type;
  }
}

Object.assign(window, {
  trackActivity,
  clearActivities,
  useActivities,
  ACTIVITY_LABELS,
  formatActivityTime,
  describeActivity,
});
