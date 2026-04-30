/* ========================================================================
   MANAGER DASHBOARD — grants bonuses, monitors player activity.
   Manager has player visibility but no balance-zero / house-edge powers.
   ======================================================================== */

const BONUS_TEMPLATES = [
  { id: 'welcome', label: 'Welcome Bonus',    defaultAmount: 250,  message: 'Welcome to the Club.' },
  { id: 'loyalty', label: 'Loyalty Bonus',    defaultAmount: 500,  message: 'Thank you for your loyalty.' },
  { id: 'reload',  label: 'Reload Bonus',     defaultAmount: 1000, message: 'On the house.' },
  { id: 'match',   label: 'Deposit Match 100%', defaultAmount: 0,  message: 'Matched to your last deposit.', dynamic: true },
  { id: 'custom',  label: 'Custom Promo',     defaultAmount: 0,    message: '' },
];

function ManagerDashboard({ user, onExit, currency }) {
  const [users, setUsers] = useState(() => window.SAMPLE_USERS || []);
  const [section, setSection] = useState('roster');
  const activities = (window.useActivities || (() => []))();
  const [bonusTargetId, setBonusTargetId] = useState(null);
  const bonusTarget = bonusTargetId != null ? users.find(u => u.id === bonusTargetId) : null;

  function applyBonus(uid, amount) {
    setUsers(us => us.map(u => u.id === uid ? { ...u, balance: u.balance + amount } : u));
  }

  // last deposit per user (for the dynamic deposit-match bonus)
  const lastDepositByUser = {};
  for (const a of activities) {
    if (a.type === 'deposit' && a.user && !(a.user in lastDepositByUser)) {
      lastDepositByUser[a.user] = a.details.amount;
    }
  }

  const bonusActivity = activities.filter(a => a.type === 'bonus_grant');

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="brand">
          <LogoMark />
        </div>
        <button className={`nav-item ${section === 'roster' ? 'active' : ''}`} onClick={() => setSection('roster')}>
          <span style={{ width: 16 }}>◯</span> Players
        </button>
        <button className={`nav-item ${section === 'bonuses' ? 'active' : ''}`} onClick={() => setSection('bonuses')}>
          <span style={{ width: 16 }}>★</span> Bonuses Granted
        </button>

        <div className="role-tag">
          <div style={{ color: 'rgba(232,223,201,0.5)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Signed in as
          </div>
          <div style={{ color: 'var(--gold-200)', fontWeight: 600 }}>{user.name}</div>
          <div style={{ color: 'rgba(232,223,201,0.6)', fontSize: 11 }}>@{user.username}</div>
          <span className="role-pill manager" style={{ marginTop: 8, display: 'inline-block' }}>Manager</span>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={onExit}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-head">
          <h1 className="gold-text">{section === 'roster' ? 'Player Roster' : 'Bonus History'}</h1>
          <div className="flex gap-12">
            <LiveTicker />
          </div>
        </div>

        {section === 'roster' && (
          <>
            <div className="kpis">
              <div className="kpi"><div className="lbl">Players</div><div className="val">{users.length}</div></div>
              <div className="kpi"><div className="lbl">Bonuses Granted</div><div className="val">{bonusActivity.length}</div></div>
              <div className="kpi"><div className="lbl">Total Bonus Paid</div><div className="val">{fmtMoney(bonusActivity.reduce((s, a) => s + (a.details.amount || 0), 0), currency)}</div></div>
            </div>

            <div className="panel">
              <div className="panel-head"><span>Players · {users.length}</span></div>
              <table className="tbl">
                <thead><tr><th>Player</th><th>Role</th><th>Joined</th><th className="num">Balance</th><th className="num">Last bet</th><th>Action</th></tr></thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ color: 'rgba(232,223,201,0.5)', fontSize: 11 }}>@{u.username}</div>
                      </td>
                      <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                      <td className="mono">{u.joined}</td>
                      <td className="mono num">{fmtMoney(u.balance, currency)}</td>
                      <td className="mono num">{u.lastBet ? fmtMoney(u.lastBet, currency) : '—'}</td>
                      <td>
                        <button className="btn btn-primary btn-sm" onClick={() => setBonusTargetId(u.id)}>★ Grant Bonus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === 'bonuses' && (
          <div className="panel">
            <div className="panel-head"><span>Bonuses Granted · {bonusActivity.length}</span></div>
            {bonusActivity.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'rgba(232,223,201,0.5)' }}>
                No bonuses granted yet.
              </div>
            ) : (
              <table className="tbl">
                <thead><tr><th>Time</th><th>By</th><th>Player</th><th>Type</th><th className="num">Amount</th><th>Note</th></tr></thead>
                <tbody>
                  {bonusActivity.map(a => (
                    <tr key={a.id}>
                      <td className="mono">{formatActivityTime(a.ts)}</td>
                      <td>@{a.user || '—'}</td>
                      <td>@{a.details.target || '—'}</td>
                      <td>{a.details.template || 'custom'}</td>
                      <td className="mono num" style={{ color: 'var(--win)' }}>+{fmtMoney(a.details.amount || 0, currency)}</td>
                      <td style={{ color: 'rgba(232,223,201,0.7)' }}>{a.details.message || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>

      {bonusTarget && (
        <BonusModal
          manager={user}
          target={bonusTarget}
          currency={currency}
          lastDeposit={lastDepositByUser[bonusTarget.username] || 0}
          onClose={() => setBonusTargetId(null)}
          onApply={applyBonus}
        />
      )}
    </div>
  );
}

// --------------------------------------------------- BonusModal
function BonusModal({ manager, target, currency, lastDeposit, onClose, onApply }) {
  const [tplId, setTplId] = useState('welcome');
  const tpl = BONUS_TEMPLATES.find(t => t.id === tplId);
  const dynamicAmount = tpl.id === 'match' ? lastDeposit : null;
  const [amount, setAmount] = useState(String(tpl.defaultAmount || 0));
  const [message, setMessage] = useState(tpl.message || '');
  const [error, setError] = useState('');

  function selectTemplate(id) {
    setTplId(id);
    const next = BONUS_TEMPLATES.find(t => t.id === id);
    if (next.dynamic && id === 'match') setAmount(String(lastDeposit || 0));
    else setAmount(String(next.defaultAmount || 0));
    setMessage(next.message || '');
  }

  function submit(e) {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (!isFinite(num) || num <= 0) return setError('Enter a bonus amount greater than zero.');
    onApply(target.id, num);
    if (window.trackActivity) {
      window.trackActivity('bonus_grant', {
        user: manager.username, role: manager.role, where: 'manager/bonus',
        details: { target: target.username, amount: num, template: tpl.id, message: message.trim() || null },
      });
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="close-x" onClick={onClose} aria-label="Close">×</button>
        <div className="auth-head">
          <h2 className="gold-text">Grant Bonus</h2>
          <p>{target.name} · @{target.username} · current {fmtMoney(target.balance, currency)}</p>
        </div>

        <form onSubmit={submit}>
          <div className="field">
            <label>Bonus type</label>
            <div className="bonus-grid">
              {BONUS_TEMPLATES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  className={`bonus-tile ${tplId === t.id ? 'on' : ''}`}
                  onClick={() => selectTemplate(t.id)}
                >
                  <span className="bonus-tile-name">{t.label}</span>
                  {t.id === 'match' ? (
                    <span className="bonus-tile-amt">{lastDeposit ? `+${fmtMoney(lastDeposit, currency)}` : 'no deposit yet'}</span>
                  ) : t.defaultAmount ? (
                    <span className="bonus-tile-amt">+{fmtMoney(t.defaultAmount, currency)}</span>
                  ) : (
                    <span className="bonus-tile-amt">custom</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>Amount ({currency})</label>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="field">
            <label>Message to player (optional)</label>
            <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Your seat is reserved." />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 12 }}>
            ★ Grant {amount ? fmtMoney(parseFloat(amount) || 0, currency) : 'Bonus'}
          </button>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, { ManagerDashboard, BonusModal, BONUS_TEMPLATES });
