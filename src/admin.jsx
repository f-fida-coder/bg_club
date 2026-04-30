/* ========================================================================
   ADMIN DASHBOARD
   ======================================================================== */

const SAMPLE_USERS = [
  { id: 1, name: 'Player One',     username: 'user',      role: 'user',  balance: 1000,   joined: '2025-09-12', lastBet: 50 },
  { id: 2, name: 'Aurelius Vance', username: 'admin',     role: 'admin', balance: 250000, joined: '2024-01-01', lastBet: null },
  { id: 3, name: 'Vlad Karenin',   username: 'vlad.k',    role: 'vip',   balance: 84200,  joined: '2025-03-04', lastBet: 5000 },
  { id: 4, name: 'Mira Solana',    username: 'mira.s',    role: 'user',  balance: 4280,   joined: '2025-07-18', lastBet: 200 },
  { id: 5, name: 'CryptoKid',      username: 'cryptokid', role: 'user',  balance: 12750,  joined: '2025-10-22', lastBet: 1250 },
  { id: 6, name: 'Yuna Hayami',    username: 'yuna.h',    role: 'vip',   balance: 102300, joined: '2024-11-30', lastBet: 5100 },
  { id: 7, name: 'Felix.x',        username: 'felix.x',   role: 'user',  balance: 320,    joined: '2026-02-14', lastBet: 80 },
  { id: 8, name: 'Tasha Reins',    username: 'tasha.r',   role: 'user',  balance: 1900,   joined: '2026-01-08', lastBet: 100 },
];

const SAMPLE_BETS = [
  { id: 'b1', user: 'vlad.k',    game: 'Blackjack', stake: 5000, payout: 7400, ts: '11:42:08' },
  { id: 'b2', user: 'mira.s',    game: 'Blackjack', stake: 200,  payout: 0,    ts: '11:41:55' },
  { id: 'b3', user: 'cryptokid', game: 'Blackjack', stake: 1250, payout: 2500, ts: '11:41:30' },
  { id: 'b4', user: 'yuna.h',    game: 'Blackjack', stake: 5100, payout: 12750, ts: '11:40:14' },
  { id: 'b5', user: 'felix.x',   game: 'Blackjack', stake: 80,   payout: 0,    ts: '11:38:50' },
  { id: 'b6', user: 'user',      game: 'Blackjack', stake: 50,   payout: 100,  ts: '11:35:22' },
  { id: 'b7', user: 'tasha.r',   game: 'Blackjack', stake: 100,  payout: 0,    ts: '11:32:11' },
];

function AdminDashboard({ user, onExit, currency }) {
  const [users, setUsers] = useState(SAMPLE_USERS);
  const [section, setSection] = useState('overview');
  const activities = (window.useActivities || (() => []))();
  const [actUserFilter, setActUserFilter] = useState('all');
  const [actTypeFilter, setActTypeFilter] = useState('all');
  const [cashTargetId, setCashTargetId] = useState(null);
  const cashTarget = cashTargetId != null ? users.find(u => u.id === cashTargetId) : null;

  const [houseEdge, setHouseEdge] = useState(() => {
    try {
      const raw = localStorage.getItem('bgclub_house_edge');
      if (raw) return { enabled: false, strength: 0, ...JSON.parse(raw) };
    } catch (e) {}
    return { enabled: false, strength: 0 };
  });
  function persistHouseEdge(next) {
    setHouseEdge(next);
    try { localStorage.setItem('bgclub_house_edge', JSON.stringify(next)); } catch (e) {}
    if (window.trackActivity) {
      window.trackActivity('house_edge_change', {
        user: user.username, role: user.role, where: 'admin/house',
        details: { enabled: next.enabled, strength: next.strength },
      });
    }
  }

  function applyCash(uid, delta) {
    setUsers(us => us.map(u => u.id === uid ? { ...u, balance: Math.max(0, u.balance + delta) } : u));
  }

  const activityUserOptions = ['all', ...Array.from(new Set(activities.map(a => a.user).filter(Boolean)))];
  const activityTypeOptions = ['all', ...Array.from(new Set(activities.map(a => a.type)))];
  const visibleActivities = activities.filter(a =>
    (actUserFilter === 'all' || a.user === actUserFilter) &&
    (actTypeFilter === 'all' || a.type === actTypeFilter)
  );

  const totalBalance = users.reduce((a, u) => a + u.balance, 0);
  const totalStakes  = SAMPLE_BETS.reduce((a, b) => a + b.stake, 0);
  const totalPayouts = SAMPLE_BETS.reduce((a, b) => a + b.payout, 0);
  const housePnl     = totalStakes - totalPayouts;

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="brand">
          <LogoMark />
        </div>
        <button className={`nav-item ${section === 'overview' ? 'active' : ''}`} onClick={() => setSection('overview')}>
          <span style={{ width: 16 }}>◇</span> Overview
        </button>
        <button className={`nav-item ${section === 'users' ? 'active' : ''}`} onClick={() => setSection('users')}>
          <span style={{ width: 16 }}>◯</span> Users
        </button>
        <button className={`nav-item ${section === 'bets' ? 'active' : ''}`} onClick={() => setSection('bets')}>
          <span style={{ width: 16 }}>◫</span> Recent Bets
        </button>
        <button className={`nav-item ${section === 'tables' ? 'active' : ''}`} onClick={() => setSection('tables')}>
          <span style={{ width: 16 }}>♠</span> Tables
        </button>
        <button className={`nav-item ${section === 'activity' ? 'active' : ''}`} onClick={() => setSection('activity')}>
          <span style={{ width: 16 }}>⌬</span> Activity
        </button>
        <button className={`nav-item ${section === 'house' ? 'active' : ''}`} onClick={() => setSection('house')}>
          <span style={{ width: 16 }}>⌖</span> House Edge
        </button>
        <div className="role-tag">
          <div style={{ color: 'rgba(232,223,201,0.5)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>
            Signed in as
          </div>
          <div style={{ color: 'var(--gold-200)', fontWeight: 600 }}>{user.name}</div>
          <div style={{ color: 'rgba(232,223,201,0.6)', fontSize: 11 }}>@{user.username}</div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: 12, width: '100%' }} onClick={onExit}>Sign Out</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-head">
          <h1 className="gold-text">{section === 'overview' ? 'Operations' : section === 'users' ? 'User Management' : section === 'bets' ? 'Live Bet Stream' : section === 'activity' ? 'User Activity' : section === 'house' ? 'House Edge' : 'Game Tables'}</h1>
          <div className="flex gap-12">
            <LiveTicker />
            <span className="balance-pill">
              <span className="lbl">House</span>
              <span className="val">{fmtMoney(housePnl, currency)}</span>
            </span>
          </div>
        </div>

        {section === 'overview' && (
          <>
            <div className="kpis">
              <div className="kpi"><div className="lbl">Total Players</div><div className="val">{users.length.toLocaleString()}</div><div className="delta pos">+12 this week</div></div>
              <div className="kpi"><div className="lbl">Player Balance</div><div className="val">{fmtMoney(totalBalance, currency)}</div><div className="delta">across all accounts</div></div>
              <div className="kpi"><div className="lbl">Wagered (24h)</div><div className="val">{fmtMoney(totalStakes, currency)}</div><div className="delta pos">+18.4%</div></div>
              <div className="kpi"><div className="lbl">House Edge (24h)</div><div className="val">{fmtMoney(housePnl, currency)}</div><div className="delta pos">+{Math.round(housePnl/totalStakes*100)}%</div></div>
            </div>
            <div className="panel">
              <div className="panel-head">
                <span>Top Players (by balance)</span>
                <button className="btn btn-outline btn-sm" onClick={() => setSection('users')}>View all →</button>
              </div>
              <table className="tbl">
                <thead><tr><th>Player</th><th>Role</th><th className="num">Balance</th><th className="num">Last bet</th></tr></thead>
                <tbody>
                  {[...users].sort((a,b) => b.balance - a.balance).slice(0, 5).map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ color: 'rgba(232,223,201,0.5)', fontSize: 11 }}>@{u.username}</div>
                      </td>
                      <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                      <td className="mono num">{fmtMoney(u.balance, currency)}</td>
                      <td className="mono num">{u.lastBet ? fmtMoney(u.lastBet, currency) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="panel">
              <div className="panel-head"><span>Live Bet Stream</span></div>
              <table className="tbl">
                <thead><tr><th>Time</th><th>Player</th><th>Game</th><th className="num">Stake</th><th className="num">Payout</th><th className="num">P/L</th></tr></thead>
                <tbody>
                  {SAMPLE_BETS.map(b => {
                    const pl = b.payout - b.stake;
                    return (
                      <tr key={b.id}>
                        <td className="mono">{b.ts}</td>
                        <td>@{b.user}</td>
                        <td>{b.game}</td>
                        <td className="mono num">{fmtMoney(b.stake, currency)}</td>
                        <td className="mono num">{fmtMoney(b.payout, currency)}</td>
                        <td className="mono num" style={{ color: pl > 0 ? 'var(--win)' : pl < 0 ? 'var(--lose)' : 'var(--push)' }}>
                          {pl >= 0 ? '+' : ''}{fmtMoney(pl, currency)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {section === 'users' && (
          <div className="panel">
            <div className="panel-head">
              <span>All Users · {users.length}</span>
              <button className="btn btn-primary btn-sm">+ Add User</button>
            </div>
            <table className="tbl">
              <thead><tr><th>Player</th><th>Role</th><th>Joined</th><th className="num">Balance</th><th>Cash</th></tr></thead>
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
                    <td>
                      <div className="adj-controls">
                        <button className="btn btn-primary btn-sm" onClick={() => setCashTargetId(u.id)}>+ Add Cash</button>
                        <button
                          className="adj-btn danger"
                          onClick={() => {
                            if (!confirm(`Zero out @${u.username}'s balance (${fmtMoney(u.balance, currency)})?`)) return;
                            applyCash(u.id, -u.balance);
                            if (window.trackActivity) {
                              window.trackActivity('admin_debit', {
                                user: user.username, role: user.role, where: 'admin/users',
                                details: { target: u.username, amount: -u.balance, reason: 'Zero balance' },
                              });
                            }
                          }}
                        >Zero</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section === 'bets' && (
          <div className="panel">
            <div className="panel-head"><span>Recent Bets</span></div>
            <table className="tbl">
              <thead><tr><th>Time</th><th>Player</th><th>Game</th><th className="num">Stake</th><th className="num">Payout</th><th className="num">P/L</th></tr></thead>
              <tbody>
                {SAMPLE_BETS.map(b => {
                  const pl = b.payout - b.stake;
                  return (
                    <tr key={b.id}>
                      <td className="mono">{b.ts}</td>
                      <td>@{b.user}</td>
                      <td>{b.game}</td>
                      <td className="mono num">{fmtMoney(b.stake, currency)}</td>
                      <td className="mono num">{fmtMoney(b.payout, currency)}</td>
                      <td className="mono num" style={{ color: pl > 0 ? 'var(--win)' : pl < 0 ? 'var(--lose)' : 'var(--push)' }}>
                        {pl >= 0 ? '+' : ''}{fmtMoney(pl, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {section === 'activity' && (
          <div className="panel">
            <div className="panel-head">
              <span>Activity Log · {visibleActivities.length} of {activities.length}</span>
              <div className="flex gap-12" style={{ alignItems: 'center' }}>
                <select className="adj-btn" value={actUserFilter} onChange={e => setActUserFilter(e.target.value)}>
                  {activityUserOptions.map(u => (
                    <option key={u} value={u}>{u === 'all' ? 'All users' : '@' + u}</option>
                  ))}
                </select>
                <select className="adj-btn" value={actTypeFilter} onChange={e => setActTypeFilter(e.target.value)}>
                  {activityTypeOptions.map(t => (
                    <option key={t} value={t}>{t === 'all' ? 'All actions' : (ACTIVITY_LABELS[t]?.label || t)}</option>
                  ))}
                </select>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => { if (confirm('Clear activity log?')) clearActivities(); }}
                >Clear</button>
              </div>
            </div>
            {visibleActivities.length === 0 ? (
              <div style={{ padding: 32, textAlign: 'center', color: 'rgba(232,223,201,0.5)' }}>
                No activity yet. Sign in, navigate, or adjust a balance to populate the log.
              </div>
            ) : (
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Where</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleActivities.map(a => {
                    const label = ACTIVITY_LABELS[a.type];
                    return (
                      <tr key={a.id}>
                        <td className="mono">{formatActivityTime(a.ts)}</td>
                        <td>
                          {a.user ? <>@{a.user}</> : <span style={{ color: 'rgba(232,223,201,0.4)' }}>—</span>}
                          {a.role && <span className={`role-pill ${a.role}`} style={{ marginLeft: 8 }}>{a.role}</span>}
                        </td>
                        <td>
                          <span className={`activity-tag ${label?.tone || 'mute'}`}>
                            {label?.label || a.type}
                          </span>
                        </td>
                        <td className="mono" style={{ color: 'rgba(232,223,201,0.6)' }}>{a.where || '—'}</td>
                        <td style={{ color: 'rgba(232,223,201,0.75)' }}>{describeActivity(a)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {section === 'house' && (
          <div className="panel">
            <div className="panel-head">
              <span>House Edge Bias</span>
              <span style={{ color: 'rgba(232,223,201,0.5)', fontSize: 11 }}>persists to localStorage · live in the game iframe</span>
            </div>
            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <p style={{ color: 'rgba(232,223,201,0.7)', fontSize: 13, lineHeight: 1.55, margin: 0 }}>
                When enabled, a percentage of player <b>hits</b> are weighted toward bust cards, and dealer <b>hits</b> below 17 are weighted toward landing in [17, 21]. Initial deal is never biased. Higher strength means a more reliable house edge but a more obvious one — keep it subtle.
              </p>

              <label className="flex gap-12" style={{ alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={houseEdge.enabled}
                  onChange={e => persistHouseEdge({ ...houseEdge, enabled: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: '#d4af37' }}
                />
                <span style={{ color: 'var(--gold-200)', fontWeight: 600 }}>House edge enabled</span>
              </label>

              <div>
                <div className="flex gap-12" style={{ alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(232,223,201,0.6)' }}>
                    Bias strength
                  </label>
                  <span className="mono" style={{ color: 'var(--gold-200)', fontSize: 14, fontWeight: 600 }}>
                    {Math.round(houseEdge.strength * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(houseEdge.strength * 100)}
                  onChange={e => persistHouseEdge({ ...houseEdge, strength: Number(e.target.value) / 100 })}
                  className="house-edge-slider"
                />
                <div className="flex" style={{ justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(232,223,201,0.45)', marginTop: 4 }}>
                  <span>Off</span>
                  <span>Subtle</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <div className="kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="kpi">
                  <div className="lbl">Mode</div>
                  <div className="val" style={{ fontSize: 18 }}>{houseEdge.enabled ? 'Active' : 'Disabled'}</div>
                  <div className="delta">{houseEdge.enabled ? 'Cards are weighted live' : 'Pure RNG'}</div>
                </div>
                <div className="kpi">
                  <div className="lbl">Player Hit Bust Probability</div>
                  <div className="val" style={{ fontSize: 18 }}>{houseEdge.enabled ? `~+${Math.round(houseEdge.strength * 100)}%` : '0%'}</div>
                  <div className="delta">when hand is ≥ 12</div>
                </div>
                <div className="kpi">
                  <div className="lbl">Dealer Recovery Bias</div>
                  <div className="val" style={{ fontSize: 18 }}>{houseEdge.enabled ? `~+${Math.round(houseEdge.strength * 100)}%` : '0%'}</div>
                  <div className="delta">land in [17, 21]</div>
                </div>
              </div>

              <div style={{ padding: 14, border: '1px dashed var(--line-strong)', borderRadius: 6, color: 'rgba(232,223,201,0.6)', fontSize: 12 }}>
                <b style={{ color: 'var(--gold-200)' }}>Payouts unchanged.</b> Wins still pay 3:2 on blackjack and 1:1 on standard wins — only the deal is weighted.
              </div>
            </div>
          </div>
        )}

        {section === 'tables' && (
          <div className="kpis" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
            {[1,2,3,4,5,6,7].map(i => (
              <div className="kpi" key={i} style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,175,55,0.08), var(--bg-2))' }}>
                <div className="lbl">Table {i.toString().padStart(2, '0')} · Blackjack</div>
                <div className="val" style={{ fontSize: 22 }}>{Math.floor(Math.random() * 5) + 1} / 7 seats</div>
                <div className="delta pos">${(Math.random() * 25000 + 5000).toFixed(0)} on the table</div>
              </div>
            ))}
          </div>
        )}
      </main>

      {cashTarget && (
        <AdjustCashModal
          admin={user}
          target={cashTarget}
          currency={currency}
          onClose={() => setCashTargetId(null)}
          onApply={applyCash}
        />
      )}
    </div>
  );
}

Object.assign(window, { AdminDashboard, SAMPLE_USERS });
