/* ========================================================================
   LANDING PAGE — single Blackjack feature, ultra-premium
   ======================================================================== */

function Landing({ onPlay, onLogin, onSignup }) {
  return (
    <div className="view">
      <nav className="nav">
        <LogoMark />
        <div className="nav-links">
          <a href="#table">The Table</a>
          <a href="#house">The House</a>
          <a href="#vault">The Vault</a>
          <LiveTicker />
        </div>
        <div className="nav-actions">
          <button className="btn btn-outline btn-sm" onClick={onLogin}>Log in</button>
          <button className="btn btn-primary btn-sm" onClick={onSignup}>Sign up</button>
        </div>
      </nav>

      <section className="hero">
        <div style={{ position: 'relative', zIndex: 2 }}>
          <span className="hero-eyebrow"><span className="dot" /> Members&apos; Lounge · Open</span>
          <h1>
            One game.
            <span className="accent">Played perfectly.</span>
          </h1>
          <p className="lead">
            BG Club is not a casino. It is a single, immaculately dealt blackjack room —
            six decks, dealer stands on seventeen, blackjack pays three to two.
            No slots. No noise. Just the cards.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary btn-lg" onClick={onPlay}>
              Take a Seat
              <span style={{ fontSize: 16 }}>→</span>
            </button>
            <button className="btn btn-ghost btn-lg" onClick={onLogin}>
              Member Sign In
            </button>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">$48.2M</div>
              <div className="lbl">Wagered Today</div>
            </div>
            <div className="hero-stat">
              <div className="num">3,420</div>
              <div className="lbl">Active Players</div>
            </div>
            <div className="hero-stat">
              <div className="num">99.5%</div>
              <div className="lbl">Provably Fair</div>
            </div>
          </div>
        </div>
        <div className="hero-art">
          <div className="glow" />
          <img className="logo-img" src="assets/bg-club-logo.png" alt="BG Club" />
        </div>
      </section>

      <section className="showcase" id="table">
        <div className="section-head">
          <div>
            <div className="eyebrow">The Only Table</div>
            <h2>Blackjack, distilled.</h2>
          </div>
          <div className="sub">
            We chose to do one thing flawlessly. Everything below is live and waiting.
          </div>
        </div>

        <div className="feature-table-card" onClick={onPlay}>
          <div className="ftc-art">
            <div className="ftc-felt" />
            <svg className="ftc-cards" viewBox="0 0 400 280">
              <defs>
                <linearGradient id="ftcGold" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#5e470f" />
                  <stop offset="0.5" stopColor="#f9d77e" />
                  <stop offset="1" stopColor="#8a691b" />
                </linearGradient>
              </defs>
              {/* fanned cards */}
              <g transform="translate(80,40) rotate(-12)">
                <rect width="110" height="160" rx="10" fill="#fafaf2" stroke="url(#ftcGold)" strokeWidth="1.5" />
                <text x="16" y="38" fontFamily="Cormorant Garamond, serif" fontSize="32" fontWeight="700" fill="#1a1410">A</text>
                <text x="16" y="60" fontSize="20" fill="#1a1410">♠</text>
                <text x="55" y="100" textAnchor="middle" fontSize="60" fill="#1a1410">♠</text>
              </g>
              <g transform="translate(150,30) rotate(0)">
                <rect width="110" height="160" rx="10" fill="#fafaf2" stroke="url(#ftcGold)" strokeWidth="1.5" />
                <text x="16" y="38" fontFamily="Cormorant Garamond, serif" fontSize="28" fontWeight="700" fill="#e94d4d">K</text>
                <text x="16" y="60" fontSize="20" fill="#e94d4d">♥</text>
                <text x="55" y="105" textAnchor="middle" fontSize="48" fontFamily="Cinzel, serif" fontWeight="700" fill="url(#ftcGold)">K</text>
              </g>
              <g transform="translate(220,40) rotate(12)">
                <rect width="110" height="160" rx="10" fill="#fafaf2" stroke="url(#ftcGold)" strokeWidth="1.5" />
                <text x="16" y="38" fontFamily="Cormorant Garamond, serif" fontSize="32" fontWeight="700" fill="#1a1410">A</text>
                <text x="16" y="60" fontSize="20" fill="#1a1410">♣</text>
                <text x="55" y="100" textAnchor="middle" fontSize="60" fill="#1a1410">♣</text>
              </g>
              {/* chips at base */}
              <g transform="translate(120,210)">
                <ellipse cx="20" cy="10" rx="22" ry="8" fill="#1a1410" stroke="url(#ftcGold)" strokeWidth="1" />
                <ellipse cx="20" cy="4" rx="22" ry="8" fill="#0a0807" stroke="url(#ftcGold)" strokeWidth="1" />
              </g>
              <g transform="translate(180,205)">
                <ellipse cx="20" cy="10" rx="22" ry="8" fill="#7c2d2d" stroke="url(#ftcGold)" strokeWidth="1" />
                <ellipse cx="20" cy="4" rx="22" ry="8" fill="#a14242" stroke="url(#ftcGold)" strokeWidth="1" />
                <ellipse cx="20" cy="-2" rx="22" ry="8" fill="#7c2d2d" stroke="url(#ftcGold)" strokeWidth="1" />
              </g>
              <g transform="translate(240,200)">
                <ellipse cx="20" cy="10" rx="22" ry="8" fill="url(#ftcGold)" />
                <ellipse cx="20" cy="4" rx="22" ry="8" fill="url(#ftcGold)" stroke="#0a0807" strokeWidth="0.5" />
                <ellipse cx="20" cy="-2" rx="22" ry="8" fill="url(#ftcGold)" stroke="#0a0807" strokeWidth="0.5" />
                <ellipse cx="20" cy="-8" rx="22" ry="8" fill="url(#ftcGold)" stroke="#0a0807" strokeWidth="0.5" />
              </g>
            </svg>
          </div>
          <div className="ftc-meta">
            <div className="ftc-name">
              <span className="ftc-eyebrow">Live Now</span>
              <h3>Blackjack</h3>
            </div>
            <div className="ftc-grid">
              <div><span>Decks</span><b>6</b></div>
              <div><span>Pays</span><b>3 : 2</b></div>
              <div><span>Min</span><b>$1</b></div>
              <div><span>Max</span><b>$5,000</b></div>
              <div><span>Hands</span><b>1 — 3</b></div>
              <div><span>Side bets</span><b>PP · 21+3</b></div>
            </div>
            <button className="btn btn-primary btn-lg" onClick={(e) => { e.stopPropagation(); onPlay(); }}>
              Deal Me In →
            </button>
          </div>
        </div>
      </section>

      <section className="house" id="house">
        <div className="house-grid">
          <div className="house-cell">
            <div className="cell-num">01</div>
            <h4>Provably Fair Shoe</h4>
            <p>Every shuffle is seeded on-chain. Verify any hand with the round hash — the cards never lie, and neither do we.</p>
          </div>
          <div className="house-cell">
            <div className="cell-num">02</div>
            <h4>Crypto Settlement</h4>
            <p>Deposit in BTC, ETH, USDT, SOL, or BNB. Withdrawals confirmed in under thirty seconds with zero house fees.</p>
          </div>
          <div className="house-cell">
            <div className="cell-num">03</div>
            <h4>Three Hands, One Seat</h4>
            <p>Play up to three positions simultaneously. Double, split, take insurance — the dealer stands on seventeen.</p>
          </div>
          <div className="house-cell">
            <div className="cell-num">04</div>
            <h4>Side Bets Worth Sitting For</h4>
            <p>Perfect Pairs pays up to 25 to one. 21+3 stretches to 100 to one on a suited three of a kind.</p>
          </div>
        </div>
      </section>

      <section className="vault" id="vault">
        <div className="vault-row">
          <div className="vault-coin"><span>₿</span><b>Bitcoin</b></div>
          <div className="vault-coin"><span>Ξ</span><b>Ethereum</b></div>
          <div className="vault-coin"><span>₮</span><b>Tether</b></div>
          <div className="vault-coin"><span>◎</span><b>Solana</b></div>
          <div className="vault-coin"><span>⬡</span><b>BNB</b></div>
        </div>
      </section>

      <footer className="foot">
        <LogoMark />
        <div className="muted-line" style={{ marginTop: 20 }}>
          BG Club · A demonstration interface · Play responsibly · This is a design prototype
        </div>
      </footer>
    </div>
  );
}

Object.assign(window, { Landing });
