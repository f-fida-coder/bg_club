/* ========================================================================
   FULL BLACKJACK GAME SHELL — embeds the standalone casino table
   ======================================================================== */

function GameShell({ user, onExit, onLogin, onBalanceChange, currency }) {
  const playerName = user?.name || 'Guest Player';
  const [walletOpen, setWalletOpen] = useState(false);

  return (
    <div className="game-shell">
      <header className="game-topbar">
        <button className="game-icon-btn" onClick={onExit} aria-label="Back to lobby">
          ←
        </button>
        <LogoMark size="sm" />
        <div className="game-topbar-spacer" />
        {user && (
          <div className="game-player-pill is-balance">
            <span>Balance</span>
            <b>{fmtMoney(user.balance, currency)}</b>
          </div>
        )}
        <div className="game-player-pill is-name">
          <span>Player</span>
          <b>{playerName}</b>
        </div>
        {user ? (
          <button className="btn btn-primary btn-sm game-wallet-btn" onClick={() => setWalletOpen(true)}>
            <span className="full">Wallet</span>
            <span className="icon" aria-hidden="true">⛁</span>
          </button>
        ) : (
          <button className="btn btn-outline btn-sm" onClick={onLogin}>
            Log in
          </button>
        )}
      </header>

      <main className="game-stage">
        {user ? (
          <BlackjackTable
            user={user}
            currency={currency}
            onBalanceChange={onBalanceChange}
          />
        ) : (
          <div className="bj-locked">
            <p>Sign in to take a seat at the table.</p>
            <button className="btn btn-primary btn-lg" onClick={onLogin}>Log in</button>
          </div>
        )}
      </main>

      {walletOpen && user && (
        <WalletModal
          user={user}
          currency={currency}
          onClose={() => setWalletOpen(false)}
          onBalanceChange={onBalanceChange}
        />
      )}
    </div>
  );
}

Object.assign(window, { GameShell });
