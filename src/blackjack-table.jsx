/* ========================================================================
   BLACKJACK TABLE — original implementation, BG Club theme.
   6-deck shoe · S17 · BJ pays 3:2 · Insurance 2:1 · Side bets PP / 21+3.
   Honors localStorage 'bgclub_house_edge' set by admin.
   ======================================================================== */

const BJ_SUITS = [
  { sym: '♠', color: 'black' },
  { sym: '♣', color: 'black' },
  { sym: '♥', color: 'red' },
  { sym: '♦', color: 'red' },
];
const BJ_RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const BJ_CHIPS = [1, 5, 10, 25, 100, 500, 1000];
const BJ_DECKS = 6;
const RESHUFFLE_AT = 60;

function bjRankValue(r) {
  if (r === 'A') return 11;
  if (r === 'K' || r === 'Q' || r === 'J') return 10;
  return Number(r);
}

function bjScore(hand) {
  let total = 0, aces = 0;
  for (const c of hand) {
    if (c.rank === 'A') { total += 11; aces++; }
    else total += bjRankValue(c.rank);
  }
  while (total > 21 && aces > 0) { total -= 10; aces--; }
  return total;
}

function bjIsSoft(hand, score) {
  let hard = 0, hasAce = false;
  for (const c of hand) {
    if (c.rank === 'A') { hard++; hasAce = true; }
    else hard += bjRankValue(c.rank);
  }
  return hasAce && score === hard + 10;
}

function bjIsBlackjack(hand) {
  return hand.length === 2 && bjScore(hand) === 21;
}

function bjCreateShoe(decks = BJ_DECKS) {
  const cards = [];
  for (let d = 0; d < decks; d++) {
    for (const s of BJ_SUITS) {
      for (const r of BJ_RANKS) {
        cards.push({ suit: s.sym, color: s.color, rank: r });
      }
    }
  }
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function bjReadHouseEdge() {
  try {
    const raw = localStorage.getItem('bgclub_house_edge');
    if (!raw) return { enabled: false, strength: 0 };
    const p = JSON.parse(raw);
    return { enabled: !!p.enabled, strength: Math.max(0, Math.min(1, Number(p.strength) || 0)) };
  } catch (e) { return { enabled: false, strength: 0 }; }
}

// Mutates `shoe` (splices the chosen card out) and returns the drawn card.
function bjBiasedDraw(shoe, target, currentHand) {
  if (!shoe.length) return null;
  const edge = bjReadHouseEdge();
  if (!edge.enabled || !edge.strength || currentHand.length < 2) return shoe.shift();
  if (Math.random() >= edge.strength) return shoe.shift();
  const score = bjScore(currentHand);
  const soft = bjIsSoft(currentHand, score);
  const window = Math.min(shoe.length, 24);
  const pool = [];
  for (let i = 0; i < window; i++) {
    const c = shoe[i];
    const v = bjRankValue(c.rank);
    const naive = score + v;
    const aceAvail = soft || c.rank === 'A';
    const adj = aceAvail && naive > 21 ? naive - 10 : naive;
    if (target === 'player' && score >= 12 && adj > 21) pool.push(i);
    else if (target === 'dealer' && score < 17 && adj >= 17 && adj <= 21) pool.push(i);
  }
  if (pool.length === 0) return shoe.shift();
  const idx = pool[Math.floor(Math.random() * pool.length)];
  const [drawn] = shoe.splice(idx, 1);
  return drawn;
}

// ----- side bets -------------------------------------------------------------
function scorePerfectPair(hand) {
  if (hand.length < 2) return 0;
  const [a, b] = hand;
  if (a.rank !== b.rank) return 0;
  if (a.suit === b.suit) return 25;   // perfect pair
  if (a.color === b.color) return 12; // colored pair
  return 6;                           // mixed pair
}

function score21Plus3(playerHand, dealerUp) {
  if (playerHand.length < 2 || !dealerUp) return 0;
  const cards = [playerHand[0], playerHand[1], dealerUp];
  const ranks = cards.map(c => c.rank);
  const suits = cards.map(c => c.suit);
  const allSuit = suits[0] === suits[1] && suits[1] === suits[2];
  const allRank = ranks[0] === ranks[1] && ranks[1] === ranks[2];
  const idx = ranks.map(r => BJ_RANKS.indexOf(r)).sort((x, y) => x - y);
  const seq = idx[2] - idx[1] === 1 && idx[1] - idx[0] === 1;
  const wrap = idx[0] === 0 && idx[1] === 11 && idx[2] === 12; // Q,K,A
  const isStraight = seq || wrap;

  if (allSuit && allRank)   return 100;
  if (allSuit && isStraight) return 40;
  if (allRank)              return 30;
  if (isStraight)           return 10;
  if (allSuit)              return 5;
  return 0;
}

// ----- main component --------------------------------------------------------
function BlackjackTable({ user, currency, onBalanceChange }) {
  const [shoe, setShoe] = useState(() => bjCreateShoe());
  const [phase, setPhase] = useState('betting'); // betting | playing | dealer | settled
  const [dealerHand, setDealerHand] = useState([]);
  const [playerHands, setPlayerHands] = useState([[]]);
  const [bets, setBets] = useState([0]);
  const [doubled, setDoubled] = useState([false]);
  const [stoodFlags, setStoodFlags] = useState([false]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [bet, setBet] = useState(0);
  const [ppBet, setPpBet] = useState(0);
  const [tpoBet, setTpoBet] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState('main'); // main | pp | tpo
  const [result, setResult] = useState(null); // {text, tone}

  const totalStake = bet + ppBet + tpoBet;
  const balance = user?.balance ?? 0;

  function setSlot(slot, valueOrFn) {
    const fn = typeof valueOrFn === 'function' ? valueOrFn : () => valueOrFn;
    if (slot === 'main') setBet(b => Math.max(0, fn(b)));
    else if (slot === 'pp') setPpBet(b => Math.max(0, fn(b)));
    else if (slot === 'tpo') setTpoBet(b => Math.max(0, fn(b)));
  }
  function getSlot(slot) {
    return slot === 'main' ? bet : slot === 'pp' ? ppBet : tpoBet;
  }
  function addChip(value) {
    if (phase !== 'betting') return;
    if (totalStake + value > balance) return;
    setSlot(selectedSlot, v => v + value);
  }
  function halveSlot(slot) { setSlot(slot, v => Math.floor(v / 2)); }
  function doubleSlot(slot) {
    const current = getSlot(slot);
    const others  = totalStake - current;
    const max     = balance - others;
    setSlot(slot, () => Math.min(current * 2, Math.max(0, max)));
  }
  function clearAllBets() {
    if (phase !== 'betting') return;
    setBet(0); setPpBet(0); setTpoBet(0);
  }

  function logRound(kind, mainNet, sideNet) {
    if (window.trackActivity) {
      window.trackActivity('blackjack_round', {
        user: user.username, role: user.role, where: 'game/blackjack',
        details: { stake: bet + ppBet + tpoBet, mainBet: bet, mainNet, sideNet, kind },
      });
    }
  }

  // ----- Deal --------------------------------------------------------------
  function deal() {
    if (phase !== 'betting' || bet < 1) return;
    if (totalStake > balance) return;

    onBalanceChange(-totalStake);

    let s = shoe.length < RESHUFFLE_AT ? bjCreateShoe() : [...shoe];
    const p1 = [s.shift(), null];
    const d  = [s.shift(), null];
    p1[1] = s.shift();
    d[1]  = s.shift();

    setShoe(s);
    setDealerHand(d);
    setPlayerHands([p1]);
    setBets([bet]);
    setDoubled([false]);
    setStoodFlags([false]);
    setActiveIdx(0);
    setRevealed(false);

    // Side bets settle on initial deal
    let sideNet = 0;
    if (ppBet > 0) {
      const m = scorePerfectPair(p1);
      if (m > 0) { onBalanceChange((m + 1) * ppBet); sideNet += m * ppBet; }
      else       { sideNet -= ppBet; }
    }
    if (tpoBet > 0) {
      const m = score21Plus3(p1, d[0]);
      if (m > 0) { onBalanceChange((m + 1) * tpoBet); sideNet += m * tpoBet; }
      else       { sideNet -= tpoBet; }
    }

    const playerBJ = bjIsBlackjack(p1);
    const dealerUpRisk = d[0].rank === 'A' || bjRankValue(d[0].rank) === 10;
    const dealerBJ = dealerUpRisk && bjIsBlackjack(d);

    if (playerBJ && dealerBJ) {
      setRevealed(true);
      onBalanceChange(bet);
      setResult({ text: 'PUSH · Both Blackjack', tone: 'push' });
      setPhase('settled');
      logRound('push', 0, sideNet);
    } else if (playerBJ) {
      setRevealed(true);
      const win = Math.floor(bet * 1.5);
      onBalanceChange(bet + win);
      setResult({ text: `BLACKJACK · +${fmtMoney(win, currency)}`, tone: 'win' });
      setPhase('settled');
      logRound('blackjack', win, sideNet);
    } else if (dealerBJ) {
      setRevealed(true);
      setResult({ text: `DEALER BLACKJACK · −${fmtMoney(bet, currency)}`, tone: 'lose' });
      setPhase('settled');
      logRound('lose', -bet, sideNet);
    } else {
      setPhase('playing');
    }
  }

  // ----- Player actions ----------------------------------------------------
  function hit() {
    if (phase !== 'playing') return;
    const i = activeIdx;
    const s = [...shoe];
    const card = bjBiasedDraw(s, 'player', playerHands[i]);
    if (!card) return;
    setShoe(s);
    const newHands = playerHands.map((h, idx) => idx === i ? [...h, card] : h);
    setPlayerHands(newHands);
    if (bjScore(newHands[i]) >= 21) advanceHand(newHands, i, stoodFlags);
  }

  function stand() {
    if (phase !== 'playing') return;
    const ns = stoodFlags.map((v, idx) => idx === activeIdx ? true : v);
    setStoodFlags(ns);
    advanceHand(playerHands, activeIdx, ns);
  }

  function double() {
    if (phase !== 'playing') return;
    const i = activeIdx;
    const h = playerHands[i];
    if (h.length !== 2) return;
    if (bets[i] > balance) return;
    onBalanceChange(-bets[i]);
    const newBets = bets.map((b, idx) => idx === i ? b * 2 : b);
    const newDoubled = doubled.map((v, idx) => idx === i ? true : v);
    setBets(newBets);
    setDoubled(newDoubled);
    const s = [...shoe];
    const card = bjBiasedDraw(s, 'player', h);
    setShoe(s);
    const newHands = playerHands.map((hh, idx) => idx === i ? [...hh, card] : hh);
    setPlayerHands(newHands);
    advanceHand(newHands, i, stoodFlags);
  }

  function split() {
    if (phase !== 'playing') return;
    if (playerHands.length !== 1) return; // only one split allowed
    const h = playerHands[0];
    if (h.length !== 2) return;
    if (bjRankValue(h[0].rank) !== bjRankValue(h[1].rank)) return;
    if (bets[0] > balance) return;
    onBalanceChange(-bets[0]);
    const s = [...shoe];
    const newH1 = [h[0], s.shift()];
    const newH2 = [h[1], s.shift()];
    setShoe(s);
    setPlayerHands([newH1, newH2]);
    setBets([bets[0], bets[0]]);
    setDoubled([false, false]);
    setStoodFlags([false, false]);
    setActiveIdx(0);
  }

  function advanceHand(currentHands, idx, currentStoodFlags) {
    if (idx + 1 < currentHands.length) {
      setActiveIdx(idx + 1);
      return;
    }
    setRevealed(true);
    setPhase('dealer');
    setTimeout(() => dealerPlay(currentHands), 600);
  }

  function dealerPlay(currentHands) {
    let d = [...dealerHand];
    let s = [...shoe];
    const everyoneBust = currentHands.every(h => bjScore(h) > 21);
    if (!everyoneBust) {
      while (bjScore(d) < 17) {
        const c = bjBiasedDraw(s, 'dealer', d);
        if (!c) break;
        d.push(c);
      }
    }
    setShoe(s);
    setDealerHand(d);
    setTimeout(() => settleAll(currentHands, d), 500);
  }

  function settleAll(currentHands, d) {
    const ds = bjScore(d);
    let payout = 0;
    currentHands.forEach((h, idx) => {
      const ps = bjScore(h);
      const stake = bets[idx];
      if (ps > 21)                        payout += 0;
      else if (ds > 21 || ps > ds)        payout += stake * 2;
      else if (ps === ds)                 payout += stake;
      else                                payout += 0;
    });
    if (payout > 0) onBalanceChange(payout);

    const totalStaked = bets.reduce((a, b) => a + b, 0);
    const net = payout - totalStaked;
    let text, tone;
    if (net > 0)      { text = `WON · +${fmtMoney(net, currency)}`;        tone = 'win';  }
    else if (net < 0) { text = `LOST · ${fmtMoney(net, currency)}`;        tone = 'lose'; }
    else              { text = 'PUSH';                                     tone = 'push'; }
    setResult({ text, tone });
    setPhase('settled');
    logRound(net > 0 ? 'win' : net < 0 ? 'lose' : 'push', net, 0);
  }

  function nextRound() {
    setPhase('betting');
    setDealerHand([]);
    setPlayerHands([[]]);
    setBets([0]);
    setStoodFlags([false]);
    setDoubled([false]);
    setActiveIdx(0);
    setRevealed(false);
    setResult(null);
  }

  // ----- derived flags for action buttons ----------------------------------
  const activeHand   = playerHands[activeIdx] || [];
  const activeScore  = bjScore(activeHand);
  const canHit       = phase === 'playing' && activeScore < 21;
  const canStand     = phase === 'playing';
  const canDouble    = phase === 'playing' && activeHand.length === 2 && bets[activeIdx] <= balance;
  const canSplit     = phase === 'playing' && playerHands.length === 1 && activeHand.length === 2 &&
                        bjRankValue(activeHand[0].rank) === bjRankValue(activeHand[1].rank) &&
                        bets[0] <= balance;

  return (
    <div className="bj">
      <div className="bj-titlebar">
        <span className="bj-title"><span style={{ color: 'var(--gold-200)' }}>♠</span> Blackjack</span>
        <span className="bj-fair">✓ Fair Play</span>
      </div>

      <div className="bj-felt">
        <div className="bj-shoe-icon">
          <div className="bj-shoe-stack" />
          <div className="bj-shoe-stack" />
          <div className="bj-shoe-stack" />
        </div>

        <div className="bj-hand-row dealer">
          <div className="bj-hand">
            {dealerHand.map((c, i) => (
              <div key={i} className="bj-card-wrap">
                <PlayingCard card={c} hidden={i === 1 && !revealed} />
              </div>
            ))}
          </div>
        </div>

        {dealerHand.length > 0 && (
          <div className={`bj-pill ${revealed && bjScore(dealerHand) > 21 ? 'bust' : ''}`}>
            {revealed ? bjScore(dealerHand) : bjRankValue(dealerHand[0].rank)}
          </div>
        )}

        <div className="bj-banner">
          <div>BLACKJACK PAYS 3 TO 2</div>
          <div>INSURANCE PAYS 2 TO 1</div>
        </div>

        {playerHands[0].length > 0 && (
          <div className="bj-pill-row">
            {playerHands.map((h, idx) => (
              <div
                key={idx}
                className={`bj-pill ${idx === activeIdx && phase === 'playing' ? 'active' : ''} ${bjScore(h) > 21 ? 'bust' : bjScore(h) === 21 ? 'win' : ''}`}
              >
                {bjScore(h)}
              </div>
            ))}
          </div>
        )}

        <div className="bj-hand-row player">
          {playerHands.map((h, idx) => (
            <div key={idx} className={`bj-hand ${idx === activeIdx && phase === 'playing' ? 'is-active' : ''}`}>
              {h.map((c, i) => (
                <div key={i} className="bj-card-wrap">
                  <PlayingCard card={c} />
                </div>
              ))}
            </div>
          ))}
        </div>

        {result && (
          <div className={`bj-result ${result.tone}`}>{result.text}</div>
        )}
      </div>

      {/* Action row */}
      {phase === 'playing' && (
        <div className="bj-actions">
          <button className="bj-act" disabled={!canDouble} onClick={double}>
            <span className="bj-act-icon" style={{ color: 'var(--win)' }}>×2</span>
            <span>Double</span>
          </button>
          <button className="bj-act" disabled={!canHit} onClick={hit}>
            <span className="bj-act-icon">✋</span>
            <span>Hit</span>
          </button>
          <button className="bj-act" disabled={!canStand} onClick={stand}>
            <span className="bj-act-icon">✋</span>
            <span>Stand</span>
          </button>
          <button className="bj-act" disabled={!canSplit} onClick={split}>
            <span className="bj-act-icon">⎙</span>
            <span>Split</span>
          </button>
        </div>
      )}

      {/* Deal Again button on settled */}
      {phase === 'settled' && (
        <div className="bj-actions">
          <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={nextRound}>Next Hand →</button>
        </div>
      )}

      {/* Betting controls */}
      {phase === 'betting' && (
        <div className="bj-bet-area">
          <div className="bj-chip-rack">
            {BJ_CHIPS.map(v => (
              <button
                key={v}
                className="bj-chip"
                disabled={totalStake + v > balance}
                onClick={() => addChip(v)}
                title={`Add ${v}`}
              >
                <span className="bj-chip-val">{v}</span>
              </button>
            ))}
            <button className="bj-chip-clear" onClick={clearAllBets} disabled={totalStake === 0}>Clear</button>
          </div>

          <div className="bj-bet-slots">
            <BetSlot
              label="Main bet"
              value={bet}
              currency={currency}
              selected={selectedSlot === 'main'}
              onSelect={() => setSelectedSlot('main')}
              onHalve={() => halveSlot('main')}
              onDouble={() => doubleSlot('main')}
            />
            <BetSlot
              label="Perfect Pair"
              value={ppBet}
              currency={currency}
              selected={selectedSlot === 'pp'}
              onSelect={() => setSelectedSlot('pp')}
              onHalve={() => halveSlot('pp')}
              onDouble={() => doubleSlot('pp')}
            />
            <BetSlot
              label="21+3"
              value={tpoBet}
              currency={currency}
              selected={selectedSlot === 'tpo'}
              onSelect={() => setSelectedSlot('tpo')}
              onHalve={() => halveSlot('tpo')}
              onDouble={() => doubleSlot('tpo')}
            />
          </div>

          <button
            className="btn btn-primary btn-lg bj-deal"
            disabled={bet < 1 || totalStake > balance}
            onClick={deal}
          >
            Deal {fmtMoney(totalStake, currency)} →
          </button>

          {bet < 1 && (
            <div className="bj-hint">Place a main bet to begin.</div>
          )}
          {totalStake > balance && (
            <div className="bj-hint warn">Total stake exceeds your balance — open the Wallet to deposit.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ----- BetSlot ---------------------------------------------------------------
function BetSlot({ label, value, currency, selected, onSelect, onHalve, onDouble }) {
  return (
    <div className={`bj-slot ${selected ? 'selected' : ''}`} onClick={onSelect}>
      <div className="bj-slot-label">{label}</div>
      <div className="bj-slot-row">
        <span className="bj-slot-amount">{fmtMoney(value, currency)}</span>
        <div className="bj-slot-actions">
          <button onClick={(e) => { e.stopPropagation(); onHalve(); }}>½</button>
          <button onClick={(e) => { e.stopPropagation(); onDouble(); }}>2×</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { BlackjackTable });
