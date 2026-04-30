/* ========================================================================
   WALLET — deposits, withdrawals, payment-method management.
   Plus AdjustCashModal used by admin to credit/debit any user account.
   This is a design prototype: no real payment is processed; methods and
   transactions are persisted to localStorage.
   ======================================================================== */

const PAYMENT_METHODS_KEY = 'bgclub_payment_methods';

const PAYMENT_TYPES = [
  { id: 'card',   label: 'Credit / Debit Card', icon: '▭' },
  { id: 'bank',   label: 'Bank Transfer',       icon: '⛁' },
  { id: 'crypto', label: 'Crypto Wallet',       icon: '₿' },
  { id: 'paypal', label: 'PayPal',              icon: '◧' },
];

const CRYPTO_OPTIONS = [
  { id: 'BTC',  label: 'Bitcoin',  symbol: '₿' },
  { id: 'ETH',  label: 'Ethereum', symbol: 'Ξ' },
  { id: 'USDT', label: 'Tether',   symbol: '₮' },
  { id: 'SOL',  label: 'Solana',   symbol: '◎' },
  { id: 'BNB',  label: 'BNB',      symbol: '⬡' },
];

function readMethods(username) {
  try {
    const raw = localStorage.getItem(PAYMENT_METHODS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return Array.isArray(all[username]) ? all[username] : [];
  } catch (e) {
    return [];
  }
}

function writeMethods(username, list) {
  try {
    const raw = localStorage.getItem(PAYMENT_METHODS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[username] = list;
    localStorage.setItem(PAYMENT_METHODS_KEY, JSON.stringify(all));
  } catch (e) {}
}

function maskCard(num) {
  const digits = String(num || '').replace(/\D/g, '');
  if (digits.length < 4) return '••••';
  return '•••• •••• •••• ' + digits.slice(-4);
}

function methodSummary(m) {
  if (m.type === 'card')   return `${m.brand || 'Card'} · ${maskCard(m.number)}`;
  if (m.type === 'bank')   return `${m.bank || 'Bank'} · •••${(m.account || '').slice(-4)}`;
  if (m.type === 'crypto') return `${m.coin || 'Crypto'} · ${(m.address || '').slice(0, 6)}…${(m.address || '').slice(-4)}`;
  if (m.type === 'paypal') return `PayPal · ${m.email}`;
  return m.type;
}

// ------------------------------------------------------------------ WalletModal
function WalletModal({ user, onClose, onBalanceChange, currency }) {
  const [tab, setTab] = useState('deposit'); // deposit | withdraw | methods
  const [methods, setMethods] = useState(() => readMethods(user.username));
  const [selectedId, setSelectedId] = useState(() => readMethods(user.username)[0]?.id || null);
  const [amount, setAmount] = useState('');
  const [feedback, setFeedback] = useState(null);

  function persistMethods(next) {
    setMethods(next);
    writeMethods(user.username, next);
  }

  function handleDepositOrWithdraw(kind) {
    const num = parseFloat(amount);
    if (!isFinite(num) || num <= 0) {
      setFeedback({ kind: 'err', text: 'Enter an amount greater than zero.' });
      return;
    }
    if (!selectedId) {
      setFeedback({ kind: 'err', text: 'Add and select a payment method first.' });
      return;
    }
    if (kind === 'withdraw' && num > user.balance) {
      setFeedback({ kind: 'err', text: 'Insufficient balance for withdrawal.' });
      return;
    }
    const method = methods.find(m => m.id === selectedId);
    const delta = kind === 'deposit' ? num : -num;
    onBalanceChange(delta);
    if (window.trackActivity) {
      window.trackActivity(kind, {
        user: user.username, role: user.role, where: 'wallet',
        details: { amount: num, method: method ? methodSummary(method) : null, methodType: method?.type },
      });
    }
    setFeedback({ kind: 'ok', text: `${kind === 'deposit' ? 'Deposited' : 'Withdrew'} ${fmtMoney(num, currency)} via ${method ? methodSummary(method) : '—'}.` });
    setAmount('');
  }

  function addMethod(m) {
    const entry = { id: 'pm_' + Date.now().toString(36), ...m };
    const next = [...methods, entry];
    persistMethods(next);
    setSelectedId(entry.id);
    if (window.trackActivity) {
      window.trackActivity('payment_method_add', {
        user: user.username, role: user.role, where: 'wallet',
        details: { type: entry.type, summary: methodSummary(entry) },
      });
    }
  }

  function removeMethod(id) {
    const removed = methods.find(m => m.id === id);
    const next = methods.filter(m => m.id !== id);
    persistMethods(next);
    if (selectedId === id) setSelectedId(next[0]?.id || null);
    if (window.trackActivity && removed) {
      window.trackActivity('payment_method_remove', {
        user: user.username, role: user.role, where: 'wallet',
        details: { type: removed.type, summary: methodSummary(removed) },
      });
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card wallet-card" onClick={e => e.stopPropagation()}>
        <button className="close-x" onClick={onClose} aria-label="Close">×</button>
        <div className="auth-head">
          <h2 className="gold-text">Wallet</h2>
          <p>Balance · <b style={{ color: 'var(--gold-200)' }}>{fmtMoney(user.balance, currency)}</b></p>
        </div>

        <div className="auth-tabs wallet-tabs">
          <button className={tab === 'deposit'  ? 'active' : ''} onClick={() => { setTab('deposit'); setFeedback(null); }}>Deposit</button>
          <button className={tab === 'withdraw' ? 'active' : ''} onClick={() => { setTab('withdraw'); setFeedback(null); }}>Withdraw</button>
          <button className={tab === 'methods'  ? 'active' : ''} onClick={() => { setTab('methods'); setFeedback(null); }}>Payment Methods</button>
        </div>

        {(tab === 'deposit' || tab === 'withdraw') && (
          <div>
            <div className="field">
              <label>Payment method</label>
              {methods.length === 0 ? (
                <div className="wallet-empty">
                  No saved methods. <button className="link-btn" onClick={() => setTab('methods')}>Add one →</button>
                </div>
              ) : (
                <div className="method-list">
                  {methods.map(m => {
                    const type = PAYMENT_TYPES.find(p => p.id === m.type);
                    return (
                      <label key={m.id} className={`method-row ${selectedId === m.id ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="pm"
                          checked={selectedId === m.id}
                          onChange={() => setSelectedId(m.id)}
                        />
                        <span className="method-icon">{type?.icon || '◇'}</span>
                        <span className="method-label">
                          <b>{type?.label || m.type}</b>
                          <span>{methodSummary(m)}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
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
              <div className="quick-amts">
                {[50, 100, 500, 1000].map(v => (
                  <button key={v} type="button" className="adj-btn" onClick={() => setAmount(String(v))}>+{v}</button>
                ))}
              </div>
            </div>

            {feedback && <div className={`auth-error ${feedback.kind === 'ok' ? 'ok' : ''}`}>{feedback.text}</div>}

            <button
              className="btn btn-primary btn-block btn-lg"
              style={{ marginTop: 12 }}
              onClick={() => handleDepositOrWithdraw(tab)}
            >
              {tab === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </button>
          </div>
        )}

        {tab === 'methods' && (
          <PaymentMethodsTab
            methods={methods}
            onAdd={addMethod}
            onRemove={removeMethod}
          />
        )}
      </div>
    </div>
  );
}

// --------------------------------------------------- PaymentMethodsTab
function PaymentMethodsTab({ methods, onAdd, onRemove }) {
  const [adding, setAdding] = useState(null); // null | 'card' | 'bank' | 'crypto' | 'paypal'

  return (
    <div>
      {methods.length === 0 ? (
        <div className="wallet-empty">No payment methods saved yet.</div>
      ) : (
        <div className="method-list">
          {methods.map(m => {
            const type = PAYMENT_TYPES.find(p => p.id === m.type);
            return (
              <div key={m.id} className="method-row">
                <span className="method-icon">{type?.icon || '◇'}</span>
                <span className="method-label">
                  <b>{type?.label || m.type}</b>
                  <span>{methodSummary(m)}</span>
                </span>
                <button className="adj-btn danger" onClick={() => onRemove(m.id)}>Remove</button>
              </div>
            );
          })}
        </div>
      )}

      {!adding && (
        <div>
          <div style={{ marginTop: 16, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(232,223,201,0.55)' }}>
            Add a method
          </div>
          <div className="method-grid">
            {PAYMENT_TYPES.map(t => (
              <button key={t.id} className="method-tile" onClick={() => setAdding(t.id)}>
                <span className="method-icon">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {adding && (
        <AddMethodForm
          kind={adding}
          onCancel={() => setAdding(null)}
          onSave={(m) => { onAdd(m); setAdding(null); }}
        />
      )}
    </div>
  );
}

// --------------------------------------------------- AddMethodForm
function AddMethodForm({ kind, onSave, onCancel }) {
  const [data, setData] = useState({});
  const [error, setError] = useState('');

  function set(k, v) { setData(d => ({ ...d, [k]: v })); }

  function submit(e) {
    e.preventDefault();
    setError('');
    if (kind === 'card') {
      const digits = (data.number || '').replace(/\D/g, '');
      if (digits.length < 12) return setError('Enter a valid card number.');
      if (!/^\d{2}\/\d{2}$/.test(data.exp || '')) return setError('Expiry must be MM/YY.');
      if (!/^\d{3,4}$/.test(data.cvv || '')) return setError('CVV must be 3-4 digits.');
      onSave({ type: 'card', brand: data.brand || 'Card', number: digits, exp: data.exp, holder: data.holder || '' });
    } else if (kind === 'bank') {
      if (!(data.bank || '').trim()) return setError('Bank name is required.');
      if (!(data.account || '').trim()) return setError('Account number is required.');
      onSave({ type: 'bank', bank: data.bank.trim(), account: data.account.replace(/\s/g, ''), holder: data.holder || '' });
    } else if (kind === 'crypto') {
      if (!data.coin) return setError('Select a coin.');
      if (!(data.address || '').trim()) return setError('Wallet address is required.');
      onSave({ type: 'crypto', coin: data.coin, address: data.address.trim() });
    } else if (kind === 'paypal') {
      if (!/^\S+@\S+\.\S+$/.test(data.email || '')) return setError('Enter a valid email.');
      onSave({ type: 'paypal', email: data.email.trim() });
    }
  }

  return (
    <form onSubmit={submit} style={{ marginTop: 12 }}>
      {kind === 'card' && (
        <>
          <div className="field"><label>Cardholder name</label>
            <input value={data.holder || ''} onChange={e => set('holder', e.target.value)} placeholder="J. Sterling" />
          </div>
          <div className="field"><label>Card number</label>
            <input value={data.number || ''} onChange={e => set('number', e.target.value)} placeholder="4242 4242 4242 4242" />
          </div>
          <div className="flex gap-12">
            <div className="field" style={{ flex: 1 }}><label>Expiry</label>
              <input value={data.exp || ''} onChange={e => set('exp', e.target.value)} placeholder="MM/YY" />
            </div>
            <div className="field" style={{ flex: 1 }}><label>CVV</label>
              <input value={data.cvv || ''} onChange={e => set('cvv', e.target.value)} placeholder="123" />
            </div>
          </div>
        </>
      )}
      {kind === 'bank' && (
        <>
          <div className="field"><label>Bank name</label>
            <input value={data.bank || ''} onChange={e => set('bank', e.target.value)} placeholder="Chase" />
          </div>
          <div className="field"><label>Account number / IBAN</label>
            <input value={data.account || ''} onChange={e => set('account', e.target.value)} placeholder="0000 0000 0000 0000" />
          </div>
          <div className="field"><label>Account holder</label>
            <input value={data.holder || ''} onChange={e => set('holder', e.target.value)} placeholder="J. Sterling" />
          </div>
        </>
      )}
      {kind === 'crypto' && (
        <>
          <div className="field"><label>Coin</label>
            <div className="crypto-row">
              {CRYPTO_OPTIONS.map(c => (
                <button
                  type="button"
                  key={c.id}
                  className={`crypto-pill ${data.coin === c.id ? 'on' : ''}`}
                  onClick={() => set('coin', c.id)}
                >
                  <span>{c.symbol}</span> {c.id}
                </button>
              ))}
            </div>
          </div>
          <div className="field"><label>Wallet address</label>
            <input value={data.address || ''} onChange={e => set('address', e.target.value)} placeholder="0x… / bc1…" />
          </div>
        </>
      )}
      {kind === 'paypal' && (
        <div className="field"><label>PayPal email</label>
          <input value={data.email || ''} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
        </div>
      )}

      {error && <div className="auth-error">{error}</div>}

      <div className="flex gap-12" style={{ marginTop: 12 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }}>Save method</button>
      </div>
    </form>
  );
}

// ------------------------------------------------------------------ AdjustCashModal (admin)
function AdjustCashModal({ admin, target, currency, onClose, onApply }) {
  const [direction, setDirection] = useState('credit'); // credit | debit
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function submit(e) {
    e.preventDefault();
    setError('');
    const num = parseFloat(amount);
    if (!isFinite(num) || num <= 0) return setError('Enter an amount greater than zero.');
    if (direction === 'debit' && num > target.balance) return setError('Cannot debit more than the player holds.');
    const delta = direction === 'credit' ? num : -num;
    onApply(target.id, delta, reason.trim());
    if (window.trackActivity) {
      window.trackActivity(direction === 'credit' ? 'admin_credit' : 'admin_debit', {
        user: admin.username, role: admin.role, where: 'admin/users',
        details: { target: target.username, amount: delta, reason: reason.trim() || null },
      });
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="auth-card" onClick={e => e.stopPropagation()}>
        <button className="close-x" onClick={onClose} aria-label="Close">×</button>
        <div className="auth-head">
          <h2 className="gold-text">{direction === 'credit' ? 'Add Cash' : 'Remove Cash'}</h2>
          <p>{target.name} · @{target.username} · current {fmtMoney(target.balance, currency)}</p>
        </div>

        <div className="auth-tabs">
          <button className={direction === 'credit' ? 'active' : ''} onClick={() => setDirection('credit')}>Credit</button>
          <button className={direction === 'debit'  ? 'active' : ''} onClick={() => setDirection('debit')}>Debit</button>
        </div>

        <form onSubmit={submit}>
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
              autoFocus
            />
            <div className="quick-amts">
              {[100, 500, 1000, 5000].map(v => (
                <button key={v} type="button" className="adj-btn" onClick={() => setAmount(String(v))}>{v}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Reason (optional)</label>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Promo bonus, manual correction…" />
          </div>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 12 }}>
            {direction === 'credit' ? `+ Credit ${amount || '0'}` : `− Debit ${amount || '0'}`}
          </button>
        </form>
      </div>
    </div>
  );
}

Object.assign(window, {
  WalletModal,
  AdjustCashModal,
  PAYMENT_TYPES,
  CRYPTO_OPTIONS,
  methodSummary,
});
