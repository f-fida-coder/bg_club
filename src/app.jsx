/* ========================================================================
   APP ROOT — routes between landing, full game, auth modal, admin
   ======================================================================== */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "currency": "USD"
}/*EDITMODE-END*/;

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'game' | 'admin' | 'manager'
  const [authMode, setAuthMode] = useState(null); // null | 'login' | 'signup'
  const [user, setUser] = useState(null);
  const [tweaks, setTweak] = (window.useTweaks || (() => [TWEAK_DEFAULTS, () => {}]))(TWEAK_DEFAULTS);
  const [currency, setCurrency] = useState(tweaks.currency || 'USD');
  const [soundOn, setSoundOn] = useState(false);

  // Sync currency tweak
  useEffect(() => {
    if (tweaks.currency && tweaks.currency !== currency) setCurrency(tweaks.currency);
  }, [tweaks.currency]);

  function persistCurrency(c) {
    setCurrency(c);
    if (typeof setTweak === 'function') {
      try { setTweak('currency', c); } catch(e) {}
    }
    if (window.trackActivity) {
      window.trackActivity('tweak_change', {
        user: user?.username, role: user?.role, where: view,
        details: { key: 'currency', value: c },
      });
    }
  }

  function goView(next) {
    if (window.trackActivity && next !== view) {
      window.trackActivity('view_change', {
        user: user?.username, role: user?.role, where: next,
        details: { from: view, to: next },
      });
    }
    setView(next);
  }

  function handleAuth(acct) {
    setUser({ ...acct });
    setAuthMode(null);
    if (acct.role === 'admin')        goView('admin');
    else if (acct.role === 'manager') goView('manager');
    else                              goView('game');
  }

  function exitToLanding() {
    if (user && window.trackActivity) {
      window.trackActivity('logout', { user: user.username, role: user.role, where: view });
    }
    setUser(null);
    goView('landing');
  }

  // Click "Play" on landing — members must sign in first.
  function tryPlay() {
    if (window.trackActivity) {
      window.trackActivity('play_click', { user: user?.username, role: user?.role, where: 'landing' });
    }
    if (user) goView('game');
    else setAuthMode('login');
  }

  return (
    <div className="app">
      {view === 'landing' && (
        <Landing
          onPlay={tryPlay}
          onLogin={() => setAuthMode('login')}
          onSignup={() => setAuthMode('signup')}
        />
      )}
      {view === 'game' && (
        <GameShell
          user={user}
          currency={currency}
          onExit={() => goView('landing')}
          onLogin={() => setAuthMode('login')}
          onBalanceChange={(delta) => setUser(u => u ? { ...u, balance: Math.max(0, (u.balance || 0) + delta) } : u)}
        />
      )}
      {view === 'admin' && user && user.role === 'admin' && (
        <AdminDashboard
          user={user}
          onExit={exitToLanding}
          currency={currency}
        />
      )}
      {view === 'manager' && user && user.role === 'manager' && (
        <ManagerDashboard
          user={user}
          onExit={exitToLanding}
          currency={currency}
        />
      )}

      {authMode && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setAuthMode(null)}
          onAuth={handleAuth}
        />
      )}

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Currency Display">
            <TweakRadio
              value={currency}
              onChange={(v) => persistCurrency(v)}
              options={[
                { value: 'USD',   label: 'USD' },
                { value: 'BTC',   label: 'BTC' },
                { value: 'CHIPS', label: 'Chips' },
              ]}
            />
          </TweakSection>
          <TweakSection title="Audio">
            <TweakToggle value={soundOn} onChange={setSoundOn} label="Sound effects" />
          </TweakSection>
        </TweaksPanel>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
