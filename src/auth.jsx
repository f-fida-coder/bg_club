/* ========================================================================
   AUTH MODAL — login & signup with hardcoded demo accounts
   ======================================================================== */

const DEMO_ACCOUNTS = {
  admin:   { username: 'admin',   password: 'admin123',   role: 'admin',   name: 'Aurelius Vance',  balance: 250000 },
  manager: { username: 'manager', password: 'manager123', role: 'manager', name: 'Selene Marchetti', balance: 0     },
  user:    { username: 'user',    password: 'user123',    role: 'user',    name: 'Player One',       balance: 1000  },
};

function AuthModal({ initialMode = 'login', onClose, onAuth }) {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    setError('');
    if (mode === 'login') {
      const acct = DEMO_ACCOUNTS[username.trim().toLowerCase()];
      if (acct && acct.password === password) {
        if (window.trackActivity) {
          window.trackActivity('login', { user: acct.username, role: acct.role, where: 'auth-modal' });
        }
        onAuth(acct);
        return;
      }
      if (window.trackActivity) {
        window.trackActivity('login_failed', {
          user: null, where: 'auth-modal',
          details: { attempted: username.trim().toLowerCase() },
        });
      }
      setError('Invalid credentials. Try the demo accounts below.');
    } else {
      if (!username || !password || !name) {
        setError('Please complete all fields.');
        return;
      }
      const acct = {
        username: username.trim().toLowerCase(),
        password, role: 'user', name, balance: 1000,
      };
      if (window.trackActivity) {
        window.trackActivity('signup', { user: acct.username, role: acct.role, where: 'auth-modal' });
      }
      onAuth(acct);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="close-x" onClick={onClose} aria-label="Close">×</button>
        <div className="auth-head">
          <div className="crest-lg">
            <svg viewBox="0 0 100 100" style={{ width: 36, height: 36 }}>
              <defs>
                <linearGradient id="goldGradAuth" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#5e470f" />
                  <stop offset="50%" stopColor="#f9d77e" />
                  <stop offset="100%" stopColor="#8a691b" />
                </linearGradient>
              </defs>
              <text x="50" y="68" textAnchor="middle"
                    fontFamily="'Cinzel', serif" fontWeight="700" fontSize="42"
                    fill="url(#goldGradAuth)">BG</text>
            </svg>
          </div>
          <h2 className="gold-text">{mode === 'login' ? 'Welcome back' : 'Join the Club'}</h2>
          <p>{mode === 'login' ? 'Step inside the members&apos; lounge.' : 'Your seat at the table awaits.'}</p>
        </div>

        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign In</button>
          <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Register</button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <div className="field">
              <label>Display name</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="J. Sterling" autoComplete="name" />
            </div>
          )}
          <div className="field">
            <label>Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
                   placeholder={mode === 'login' ? 'admin or user' : 'choose a username'}
                   autoComplete="username" autoFocus />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 12 }}>
            {mode === 'login' ? 'Enter the Lounge' : 'Create Account'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="demo-creds">
            <div className="title">Demo Accounts</div>
            <div className="row"><span className="role">Player</span><span>user / user123</span></div>
            <div className="row"><span className="role">Manager</span><span>manager / manager123</span></div>
            <div className="row"><span className="role">Admin</span><span>admin / admin123</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { AuthModal, DEMO_ACCOUNTS });
