/* ========================================================================
   UI PRIMITIVES — logo, card, chip
   ======================================================================== */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// --------------------------------------------------------------- MONEY FORMATTER
function fmtMoney(amount, currency = 'USD') {
  const n = Number(amount) || 0;
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (currency === 'BTC') {
    return `${sign}₿${(abs / 50000).toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  }
  if (currency === 'CHIPS') {
    return `${sign}${Math.round(abs).toLocaleString()} chips`;
  }
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// --------------------------------------------------------------- LOGO MARK
function LogoMark({ size = 'md', showText = true }) {
  return (
    <a className="logo-mark" href="#" onClick={e => e.preventDefault()}>
      <div className="crest">
        <svg viewBox="0 0 100 100" fill="none">
          <defs>
            <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5e470f" />
              <stop offset="25%" stopColor="#d4af37" />
              <stop offset="50%" stopColor="#f9d77e" />
              <stop offset="75%" stopColor="#d4af37" />
              <stop offset="100%" stopColor="#8a691b" />
            </linearGradient>
          </defs>
          {/* Crown */}
          <path d="M30 32 L37 22 L43 30 L50 18 L57 30 L63 22 L70 32 L68 38 L32 38 Z"
                fill="url(#goldGrad)" />
          <rect x="32" y="38" width="36" height="3" fill="url(#goldGrad)" />
          {/* BG monogram */}
          <text x="50" y="76" textAnchor="middle"
                fontFamily="'Cinzel', serif" fontWeight="700" fontSize="38"
                fill="url(#goldGrad)">BG</text>
        </svg>
      </div>
      {showText && (
        <div className="wordmark">
          <div className="row1">BG CLUB</div>
          <div className="row2">Casino · Blackjack</div>
        </div>
      )}
    </a>
  );
}

// --------------------------------------------------------------- PLAYING CARD
function PlayingCard({ card, hidden = false }) {
  if (hidden || !card) {
    return <div className="card-svg back" />;
  }
  const isFace = ['J', 'Q', 'K'].includes(card.rank);
  return (
    <div className={`card-svg ${card.color} ${isFace ? 'face' : ''}`}>
      <div className="corner tl">
        <span className="rank">{card.rank}</span>
        <span className="pip">{card.suit}</span>
      </div>
      {isFace ? (
        <div className="face-art">{card.rank}</div>
      ) : card.rank === 'A' ? (
        <div className="center-pip">{card.suit}</div>
      ) : (
        <div className="center-pip" style={{ fontSize: 28 }}>
          {pipPattern(card)}
        </div>
      )}
      <div className="corner br">
        <span className="rank">{card.rank}</span>
        <span className="pip">{card.suit}</span>
      </div>
    </div>
  );
}

function pipPattern(card) {
  const n = parseInt(card.rank, 10);
  if (isNaN(n)) return card.suit;
  // Just show suit-count grid layout
  const positions = {
    2:  [[50,30],[50,70]],
    3:  [[50,25],[50,50],[50,75]],
    4:  [[35,30],[65,30],[35,70],[65,70]],
    5:  [[35,25],[65,25],[50,50],[35,75],[65,75]],
    6:  [[35,25],[65,25],[35,50],[65,50],[35,75],[65,75]],
    7:  [[35,25],[65,25],[50,37],[35,50],[65,50],[35,75],[65,75]],
    8:  [[35,22],[65,22],[35,40],[65,40],[35,60],[65,60],[35,78],[65,78]],
    9:  [[35,22],[65,22],[35,40],[65,40],[50,50],[35,60],[65,60],[35,78],[65,78]],
    10: [[35,18],[65,18],[35,35],[65,35],[50,27],[50,73],[35,65],[65,65],[35,82],[65,82]],
  };
  const ps = positions[n] || [];
  return (
    <svg viewBox="0 0 100 100" style={{ width: 64, height: 90 }}>
      {ps.map(([x,y], i) => (
        <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle"
              fontSize="22" fill="currentColor">
          {card.suit}
        </text>
      ))}
    </svg>
  );
}

// --------------------------------------------------------------- TOAST
function Toast({ kind, children }) {
  return <div className={`toast ${kind || ''}`}>{children}</div>;
}

// --------------------------------------------------------------- TICKER (live winners)
function LiveTicker() {
  const items = [
    { name: 'Vlad K.', game: 'Blackjack', amount: '+$2,400' },
    { name: 'Mira S.', game: 'Blackjack', amount: '+$840' },
    { name: 'CryptoKid', game: 'Roulette', amount: '+$1,250' },
    { name: 'Yuna H.',  game: 'Blackjack', amount: '+$5,100' },
    { name: 'Felix.x',  game: 'Slots',     amount: '+$320' },
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % items.length), 2400);
    return () => clearInterval(t);
  }, []);
  const it = items[idx];
  return (
    <div className="ticker">
      <span className="live-dot" />
      <span style={{ color: 'var(--gold-200)' }}>{it.name}</span>
      <span style={{ color: 'rgba(232,223,201,0.5)' }}>· {it.game} ·</span>
      <span style={{ color: 'var(--win)' }}>{it.amount}</span>
    </div>
  );
}

// --------------------------------------------------------------- AUDIO ENGINE (simple WebAudio)
function useAudio(enabled) {
  const ctxRef = useRef(null);
  useEffect(() => {
    if (enabled && !ctxRef.current) {
      try { ctxRef.current = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){}
    }
  }, [enabled]);
  const play = useCallback((kind) => {
    if (!enabled || !ctxRef.current) return;
    const ctx = ctxRef.current;
    const now = ctx.currentTime;
    if (kind === 'deal') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(800, now);
      o.frequency.exponentialRampToValueAtTime(400, now + 0.08);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.12);
    } else if (kind === 'chip') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(1200, now);
      o.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.1);
    } else if (kind === 'win') {
      [523, 659, 784, 1047].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        g.gain.setValueAtTime(0, now + i*0.08);
        g.gain.linearRampToValueAtTime(0.06, now + i*0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i*0.08 + 0.25);
        o.connect(g).connect(ctx.destination);
        o.start(now + i*0.08); o.stop(now + i*0.08 + 0.3);
      });
    } else if (kind === 'lose') {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(220, now);
      o.frequency.exponentialRampToValueAtTime(110, now + 0.4);
      g.gain.setValueAtTime(0.05, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.5);
    }
  }, [enabled]);
  return play;
}

Object.assign(window, { LogoMark, PlayingCard, Toast, LiveTicker, useAudio, fmtMoney });
