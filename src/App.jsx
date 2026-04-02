import { useState, useEffect, useCallback } from 'react'
import './App.css'

// ── Seed data ─────────────────────────────────────────────────────────────────
const INITIAL_BOOKS = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', isbn: '978-0743273565', copies: 3, available: 2, cover: '📗' },
  { id: 2, title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', isbn: '978-0061935466', copies: 2, available: 1, cover: '📘' },
  { id: 3, title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', isbn: '978-0132350884', copies: 4, available: 4, cover: '📙' },
  { id: 4, title: '1984', author: 'George Orwell', genre: 'Dystopian', isbn: '978-0451524935', copies: 3, available: 0, cover: '📕' },
  { id: 5, title: 'Dune', author: 'Frank Herbert', genre: 'Sci-Fi', isbn: '978-0441013593', copies: 2, available: 2, cover: '📗' },
  { id: 6, title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', isbn: '978-0062316097', copies: 2, available: 1, cover: '📘' },
  { id: 7, title: 'Atomic Habits', author: 'James Clear', genre: 'Self-Help', isbn: '978-0735211292', copies: 3, available: 2, cover: '📙' },
  { id: 8, title: 'The Alchemist', author: 'Paulo Coelho', genre: 'Fiction', isbn: '978-0062315007', copies: 2, available: 2, cover: '📕' },
]

const INITIAL_MEMBERS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@email.com', phone: '555-0101', joined: '2024-01-15', avatar: 'AJ' },
  { id: 2, name: 'Bob Smith', email: 'bob@email.com', phone: '555-0102', joined: '2024-02-20', avatar: 'BS' },
  { id: 3, name: 'Clara Davis', email: 'clara@email.com', phone: '555-0103', joined: '2024-03-05', avatar: 'CD' },
  { id: 4, name: 'David Lee', email: 'david@email.com', phone: '555-0104', joined: '2024-04-10', avatar: 'DL' },
]

const INITIAL_TRANSACTIONS = [
  { id: 1, bookId: 2, memberId: 1, type: 'borrow', date: '2025-03-01', due: '2025-03-15', returned: false, notified: false },
  { id: 2, bookId: 1, memberId: 2, type: 'borrow', date: '2025-03-05', due: '2025-03-19', returned: false, notified: false },
  { id: 3, bookId: 4, memberId: 4, type: 'borrow', date: '2025-02-28', due: '2025-03-13', returned: false, notified: true },
  { id: 4, bookId: 3, memberId: 1, type: 'return', date: '2025-03-08', due: '2025-03-20', returned: true, notified: false },
  { id: 5, bookId: 6, memberId: 4, type: 'borrow', date: '2025-03-18', due: '2025-04-01', returned: false, notified: false },
]

const DEMO_CREDENTIALS = { username: 'admin', password: 'admin123' }

// ── Helpers ───────────────────────────────────────────────────────────────────
const genId = (arr) => (arr.length ? Math.max(...arr.map((x) => x.id)) + 1 : 1)
const today = () => new Date().toISOString().split('T')[0]
const dueDate = () => { const d = new Date(); d.setDate(d.getDate() + 14); return d.toISOString().split('T')[0] }
const isOverdue = (due, returned) => !returned && new Date(due) < new Date()
const daysOverdue = (due) => Math.floor((new Date() - new Date(due)) / 86400000)
const avatarColor = (str) => {
  const colors = ['#6366f1','#8b5cf6','#ec4899','#14b8a6','#f59e0b','#10b981','#3b82f6','#f97316']
  let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) % colors.length
  return colors[h]
}

let _toastId = 0

// ── Toast System ──────────────────────────────────────────────────────────────
function Toasts({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span className="toast-icon">{t.type === 'success' ? '✅' : t.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
          <span className="toast-msg">{t.msg}</span>
          <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ── Notification Panel ────────────────────────────────────────────────────────
function NotificationPanel({ transactions, books, members, onClose, onNotify, onNotifyAll }) {
  const overdue = transactions.filter((t) => isOverdue(t.due, t.returned))
  return (
    <div className="notif-backdrop" onClick={onClose}>
      <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notif-header">
          <div>
            <h3>🔔 Overdue Alerts</h3>
            <p className="notif-sub">{overdue.length} item{overdue.length !== 1 ? 's' : ''} overdue</p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {overdue.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={onNotifyAll}>📨 Notify All</button>
            )}
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        </div>
        <div className="notif-list">
          {overdue.length === 0 ? (
            <div className="notif-empty"><span>🎉</span><p>No overdue books! All on time.</p></div>
          ) : overdue.map((tx) => {
            const book = books.find((b) => b.id === tx.bookId)
            const member = members.find((m) => m.id === tx.memberId)
            const days = daysOverdue(tx.due)
            return (
              <div key={tx.id} className={`notif-item ${tx.notified ? 'notif-sent' : ''}`}>
                <div className="notif-avatar" style={{ background: avatarColor(member?.name || '') }}>{member?.avatar}</div>
                <div className="notif-info">
                  <p className="notif-member">{member?.name}</p>
                  <p className="notif-book">📖 {book?.title}</p>
                  <div className="notif-tags">
                    <span className="overdue-chip">⚠️ {days}d overdue</span>
                    <span className="email-chip">✉️ {member?.email}</span>
                  </div>
                </div>
                <button className={`btn btn-sm ${tx.notified ? 'btn-success' : 'btn-primary'}`} onClick={() => onNotify(tx, member, book)}>
                  {tx.notified ? '✔ Sent' : '📨 Notify'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Login Page ────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!username || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    setTimeout(() => {
      if (username === DEMO_CREDENTIALS.username && password === DEMO_CREDENTIALS.password) {
        onLogin(username)
      } else {
        setError('Invalid credentials. Try admin / admin123')
        setLoading(false)
      }
    }, 900)
  }

  return (
    <div className="login-bg">
      {/* Ambient orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
          </span>
        </div>
        <h1 className="login-title">LibraryHub</h1>
        <p className="login-sub">Sign in to your admin account</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-wrap">
              <span className="input-icon">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" className="show-pass-btn" style={{fontSize: '13px', fontWeight: 600}} onClick={() => setShowPass(!showPass)}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && <div className="login-error">⚠️ {error}</div>}
          <button type="submit" className={`btn btn-primary login-btn ${loading ? 'btn-loading' : ''}`} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In →'}
          </button>
        </form>

        <div className="login-hint">
          <span>Demo credentials: </span>
          <code>admin</code> / <code>admin123</code>
        </div>
      </div>
    </div>
  )
}

// ── Top Header ────────────────────────────────────────────────────────────────
function Header({ page, overdueCount, setShowNotif, user, onLogout }) {
  const labels = { dashboard: 'Dashboard', books: 'Books', members: 'Members', transactions: 'Transactions' }
  const icons  = { dashboard: '🏠', books: '📚', members: '👥', transactions: '🔄' }
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-page-icon">{icons[page]}</span>
        <div>
          <h2 className="topbar-title">{labels[page]}</h2>
          <p className="topbar-date">{new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</p>
        </div>
      </div>
      <div className="topbar-right">
        <button className={`notif-btn ${overdueCount > 0 ? 'has-notif' : ''}`} onClick={() => setShowNotif(true)} title="Overdue Alerts">
          <span>🔔</span>
          {overdueCount > 0 && <span className="notif-count">{overdueCount}</span>}
        </button>
        <div className="topbar-divider" />
        <div className="topbar-user">
          <div className="topbar-avatar">{user[0].toUpperCase()}</div>
          <div>
            <p className="topbar-name">{user}</p>
            <p className="topbar-role">Administrator</p>
          </div>
        </div>
        <button className="btn btn-sm btn-ghost-danger" onClick={onLogout} title="Logout">↩</button>
      </div>
    </header>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, gradient, trend }) {
  return (
    <div className="stat-card">
      <div className="stat-card-glow" style={{ background: gradient }} />
      <div className="stat-icon-wrap" style={{ background: gradient }}>
        <span className="stat-icon">{icon}</span>
      </div>
      <div className="stat-info">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
      {trend && <div className="stat-trend">{trend}</div>}
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ books, members, transactions }) {
  const totalBooks  = books.reduce((s, b) => s + b.copies, 0)
  const borrowed    = books.reduce((s, b) => s + (b.copies - b.available), 0)
  const overdue     = transactions.filter((t) => isOverdue(t.due, t.returned))
  const utilization = Math.round((borrowed / Math.max(totalBooks, 1)) * 100)
  const recentTx    = [...transactions].reverse().slice(0, 6)

  return (
    <div className="page">
      <div className="welcome-banner">
        <div>
          <h1 className="welcome-title">Welcome back, Librarian 👋</h1>
          <p className="welcome-sub">Here's what's happening in your library today.</p>
        </div>
        <div className="welcome-date-box">
          <p className="wd-day">{new Date().toLocaleDateString('en-US',{weekday:'long'})}</p>
          <p className="wd-full">{new Date().toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📚" label="Total Books"   value={totalBooks}      sub={`${books.length} unique titles`}  gradient="linear-gradient(135deg,#6366f1,#4338ca)" trend={`${books.filter(b=>b.available>0).length} available`} />
        <StatCard icon="👥" label="Members"       value={members.length}  sub="Registered users"                 gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)" trend="+1 this month" />
        <StatCard icon="🔄" label="Borrowed"      value={borrowed}        sub="Currently checked out"            gradient="linear-gradient(135deg,#14b8a6,#0d9488)" trend={`${utilization}% utilization`} />
        <StatCard icon="⚠️" label="Overdue"       value={overdue.length}  sub={overdue.length ? 'Need attention' : 'All on time!'} gradient="linear-gradient(135deg,#f59e0b,#d97706)" trend={overdue.length ? 'Action required' : '✅ Great!'} />
      </div>

      <div className="dashboard-grid">
        {/* Recent Activity */}
        <div className="glass-card">
          <div className="card-header-row">
            <h2 className="card-title">📋 Recent Activity</h2>
            <span className="badge-count">{recentTx.length}</span>
          </div>
          <div className="activity-list">
            {recentTx.map((tx) => {
              const book   = books.find((b) => b.id === tx.bookId)
              const member = members.find((m) => m.id === tx.memberId)
              const over   = isOverdue(tx.due, tx.returned)
              return (
                <div key={tx.id} className={`activity-item ${over ? 'ai-overdue' : tx.returned ? 'ai-returned' : 'ai-active'}`}>
                  <div className="activity-avatar" style={{ background: avatarColor(member?.name||'') }}>{member?.avatar}</div>
                  <div className="activity-info">
                    <p className="activity-text"><strong>{member?.name}</strong> {tx.returned ? 'returned' : 'borrowed'} <em>"{book?.title}"</em></p>
                    <p className="activity-meta">📅 {tx.date} · Due {tx.due}{over && <span className="overdue-inline"> · {daysOverdue(tx.due)}d overdue</span>}</p>
                  </div>
                  <span className={`pill ${tx.returned ? 'pill-green' : over ? 'pill-red' : 'pill-blue'}`}>
                    {tx.returned ? 'Returned' : over ? 'Overdue' : 'Active'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="dash-right-col">
          {/* Overdue Alert Widget */}
          {overdue.length > 0 && (
            <div className="overdue-widget">
              <div className="ow-header"><span>🚨 Overdue Books</span><span className="ow-count">{overdue.length}</span></div>
              {overdue.slice(0,3).map((tx) => {
                const book   = books.find((b) => b.id === tx.bookId)
                const member = members.find((m) => m.id === tx.memberId)
                return (
                  <div key={tx.id} className="ow-item">
                    <span className="ow-book">{book?.cover} {book?.title}</span>
                    <span className="ow-meta">{member?.name} · {daysOverdue(tx.due)}d overdue</span>
                  </div>
                )
              })}
              {overdue.length > 3 && <p className="ow-more">+{overdue.length - 3} more…</p>}
            </div>
          )}

          {/* Genre chart */}
          <div className="glass-card">
            <h2 className="card-title" style={{ marginBottom:18 }}>📊 Collection by Genre</h2>
            <div className="genres-list">
              {[...new Set(books.map((b) => b.genre))].map((genre, i) => {
                const count = books.filter((b) => b.genre === genre).length
                const w = Math.round((count / books.length) * 100)
                const barColors = ['#6366f1','#8b5cf6','#14b8a6','#f59e0b','#ec4899','#10b981','#3b82f6','#f97316']
                return (
                  <div key={genre} className="genre-row">
                    <div className="genre-meta"><span className="genre-name">{genre}</span><span className="genre-count">{count}</span></div>
                    <div className="genre-track">
                      <div className="genre-fill" style={{ width:`${w}%`, background: barColors[i % barColors.length] }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick stats */}
          <div className="glass-card quick-stats">
            <h2 className="card-title" style={{ marginBottom:14 }}>⚡ Quick Stats</h2>
            <div className="qs-grid">
              <div className="qs-cell"><span className="qs-val">{utilization}%</span><span className="qs-key">Utilization</span></div>
              <div className="qs-cell"><span className="qs-val">{books.filter(b=>b.available===0).length}</span><span className="qs-key">Out of Stock</span></div>
              <div className="qs-cell"><span className="qs-val">{transactions.filter(t=>t.returned).length}</span><span className="qs-key">Returned</span></div>
              <div className="qs-cell"><span className="qs-val">{transactions.filter(t=>t.notified).length}</span><span className="qs-key">Notified</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Books ─────────────────────────────────────────────────────────────────────
function Books({ books, setBooks, transactions, setTransactions, members }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [showAdd, setShowAdd] = useState(false)
  const [showBorrow, setShowBorrow] = useState(null)
  const [form, setForm] = useState({ title:'', author:'', genre:'', isbn:'', copies:1 })
  const [borrowMember, setBorrowMember] = useState('')

  const genres  = ['All', ...new Set(books.map((b) => b.genre))]
  const filtered = books.filter((b) =>
    (filter === 'All' || b.genre === filter) &&
    (b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()))
  )
  const covers = ['📗','📘','📙','📕']

  const addBook = () => {
    if (!form.title || !form.author) return
    setBooks([...books, { ...form, id: genId(books), copies: +form.copies, available: +form.copies, cover: covers[genId(books) % 4] }])
    setForm({ title:'', author:'', genre:'', isbn:'', copies:1 }); setShowAdd(false)
  }
  const deleteBook = (id) => setBooks(books.filter((b) => b.id !== id))
  const borrowBook = () => {
    if (!borrowMember) return
    setTransactions([...transactions, { id:genId(transactions), bookId:showBorrow.id, memberId:+borrowMember, type:'borrow', date:today(), due:dueDate(), returned:false, notified:false }])
    setBooks(books.map((b) => b.id === showBorrow.id ? { ...b, available:b.available-1 } : b))
    setBorrowMember(''); setShowBorrow(null)
  }

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Books</h1><p className="page-sub">{books.length} titles · {books.reduce((s,b)=>s+b.available,0)} available</p></div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>＋ Add Book</button>
      </div>
      <div className="toolbar">
        <input className="search-input" placeholder="🔍  Search by title or author…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <div className="chip-row">
          {genres.map((g) => <button key={g} className={`chip ${filter===g?'chip-active':''}`} onClick={() => setFilter(g)}>{g}</button>)}
        </div>
      </div>
      <div className="books-grid">
        {filtered.map((book) => {
          const pct = Math.round((book.available / book.copies) * 100)
          return (
            <div key={book.id} className="book-card">
              <div className="book-cover-wrap">
                <span className="book-cover-emoji">{book.cover}</span>
                <span className={`avail-chip ${book.available===0?'avail-red':''}`}>{book.available}/{book.copies}</span>
              </div>
              <p className="book-title">{book.title}</p>
              <p className="book-author">{book.author}</p>
              <span className="genre-pill">{book.genre}</span>
              <div className="avail-track"><div className="avail-fill" style={{ width:`${pct}%`, background: pct===0?'#ef4444':pct<40?'#f59e0b':'#10b981' }} /></div>
              <div className="book-actions">
                <button className="btn btn-sm btn-outline" disabled={book.available===0} onClick={() => setShowBorrow(book)}>
                  {book.available===0 ? 'Unavailable' : '📤 Borrow'}
                </button>
                <button className="btn btn-sm btn-ghost-danger" onClick={() => deleteBook(book.id)}>🗑</button>
              </div>
            </div>
          )
        })}
      </div>
      {showAdd && (
        <Modal title="📚 Add New Book" onClose={() => setShowAdd(false)}>
          <div className="form-grid">
            {[['title','Title'],['author','Author'],['genre','Genre'],['isbn','ISBN']].map(([k,l]) => (
              <div key={k} className="form-group"><label>{l}</label><input value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} placeholder={l} /></div>
            ))}
            <div className="form-group"><label>Copies</label><input type="number" min="1" value={form.copies} onChange={(e)=>setForm({...form,copies:e.target.value})} /></div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addBook}>Add Book</button>
          </div>
        </Modal>
      )}
      {showBorrow && (
        <Modal title={`📤 Borrow: ${showBorrow.title}`} onClose={() => setShowBorrow(null)}>
          <div className="form-body">
            <div className="form-group"><label>Select Member</label>
              <select value={borrowMember} onChange={(e)=>setBorrowMember(e.target.value)}>
                <option value="">— Choose member —</option>
                {members.map((m)=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="info-banner">📅 Due date set 14 days from today ({dueDate()})</div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={()=>setShowBorrow(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={borrowBook}>Confirm Borrow</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Members ───────────────────────────────────────────────────────────────────
function Members({ members, setMembers, transactions, books }) {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'' })

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase())
  )
  const addMember = () => {
    if (!form.name || !form.email) return
    setMembers([...members, { ...form, id:genId(members), joined:today(), avatar:form.name.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) }])
    setForm({name:'',email:'',phone:''}); setShowAdd(false)
  }
  const getBorrowed = (mid) => transactions.filter((t)=>t.memberId===mid&&!t.returned).map((t)=>books.find((b)=>b.id===t.bookId)).filter(Boolean)
  const hasOverdue  = (mid) => transactions.some((t)=>t.memberId===mid&&isOverdue(t.due,t.returned))

  return (
    <div className="page">
      <div className="page-header">
        <div><h1>Members</h1><p className="page-sub">{members.length} registered</p></div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>＋ Add Member</button>
      </div>
      <input className="search-input mb-6" placeholder="🔍  Search members…" value={search} onChange={(e)=>setSearch(e.target.value)} />
      <div className="members-grid">
        {filtered.map((member) => {
          const borrowed = getBorrowed(member.id)
          const over     = hasOverdue(member.id)
          return (
            <div key={member.id} className={`member-card ${over?'member-card-overdue':''}`}>
              {over && <div className="overdue-ribbon">⚠️ Overdue</div>}
              <div className="member-top">
                <div className="member-avatar" style={{ background:avatarColor(member.name) }}>{member.avatar}</div>
                <div>
                  <p className="member-name">{member.name}</p>
                  <p className="member-email">{member.email}</p>
                  <p className="member-phone">📞 {member.phone}</p>
                </div>
              </div>
              <div className="member-divider" />
              <div className="member-meta">
                <span>🗓 Joined {member.joined}</span>
                <span className={`borrow-count ${over?'borrow-red':''}`}>📚 {borrowed.length} borrowed</span>
              </div>
              <div className="borrowed-tags">
                {borrowed.map((b,i)=><span key={i} className="borrowed-tag">{b.cover} {b.title}</span>)}
                {borrowed.length===0 && <span className="no-books-tag">No active borrows</span>}
              </div>
            </div>
          )
        })}
      </div>
      {showAdd && (
        <Modal title="👤 Add New Member" onClose={()=>setShowAdd(false)}>
          <div className="form-grid">
            {[['name','Full Name'],['email','Email'],['phone','Phone']].map(([k,l])=>(
              <div key={k} className="form-group"><label>{l}</label><input value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} placeholder={l} /></div>
            ))}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addMember}>Add Member</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ── Transactions ──────────────────────────────────────────────────────────────
function Transactions({ transactions, setTransactions, books, setBooks, members }) {
  const [filter, setFilter] = useState('all')

  const counts = {
    all: transactions.length,
    active: transactions.filter(t=>!t.returned).length,
    overdue: transactions.filter(t=>isOverdue(t.due,t.returned)).length,
    returned: transactions.filter(t=>t.returned).length,
  }
  const filtered = transactions.filter((t) =>
    filter==='all'      ? true :
    filter==='active'   ? !t.returned :
    filter==='overdue'  ? isOverdue(t.due,t.returned) :
    t.returned
  )
  const returnBook = (tx) => {
    setTransactions(transactions.map((t)=>t.id===tx.id?{...t,returned:true,type:'return'}:t))
    setBooks(books.map((b)=>b.id===tx.bookId?{...b,available:b.available+1}:b))
  }

  return (
    <div className="page">
      <div className="page-header"><div><h1>Transactions</h1><p className="page-sub">{transactions.length} total records</p></div></div>
      <div className="chip-row mb-6">
        {[['all','All'],['active','Active'],['overdue','Overdue'],['returned','Returned']].map(([val,label])=>(
          <button key={val} className={`chip ${filter===val?'chip-active':''}`} onClick={()=>setFilter(val)}>
            {label} <span className="chip-count">{counts[val]}</span>
          </button>
        ))}
      </div>
      <div className="tx-wrap">
        <table className="tx-table">
          <thead><tr><th>#</th><th>Book</th><th>Member</th><th>Borrowed</th><th>Due Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((tx) => {
              const book   = books.find((b)=>b.id===tx.bookId)
              const member = members.find((m)=>m.id===tx.memberId)
              const over   = isOverdue(tx.due,tx.returned)
              return (
                <tr key={tx.id} className={over?'row-overdue':tx.returned?'row-returned':''}>
                  <td className="td-id">{tx.id}</td>
                  <td><div className="cell-book"><span>{book?.cover}</span><span className="cell-btitle">{book?.title}</span></div></td>
                  <td>
                    <div className="cell-member">
                      <div className="mini-avatar" style={{ background:avatarColor(member?.name||'') }}>{member?.avatar}</div>
                      <div><p className="cell-mname">{member?.name}</p><p className="cell-memail">{member?.email}</p></div>
                    </div>
                  </td>
                  <td className="td-date">{tx.date}</td>
                  <td className={over?'td-overdue':'td-date'}>{tx.due}{over&&<span className="days-chip">{daysOverdue(tx.due)}d</span>}</td>
                  <td><span className={`pill ${tx.returned?'pill-green':over?'pill-red':'pill-blue'}`}>{tx.returned?'✔ Returned':over?'⚠ Overdue':'● Active'}</span></td>
                  <td>{!tx.returned&&<button className="btn btn-sm btn-outline" onClick={()=>returnBook(tx)}>Return</button>}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length===0&&<div className="empty-state"><span>📭</span><p>No transactions in this category.</p></div>}
      </div>
    </div>
  )
}

// ── Bumblebee Chatbot ────────────────────────────────────────────────────────
function Chatbot({ books }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { text: "Hi! I'm Bumblebee. Need a book recommendation?", sender: 'bot' }
  ])
  const [input, setInput] = useState('')
  
  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMsg = input.trim()
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }])
    setInput('')
    
    setTimeout(() => {
      const keywords = userMsg.toLowerCase().split(' ')
      const match = books.find(b => keywords.some(k => b.genre.toLowerCase().includes(k) || b.title.toLowerCase().includes(k) || b.author.toLowerCase().includes(k)))
      const reply = match 
        ? `I highly recommend "${match.title}" by ${match.author}. It's a great ${match.genre} book!` 
        : `Hmm, I don't have a specific book for that right now. Could you tell me your favorite genre?`
      setMessages(prev => [...prev, { text: reply, sender: 'bot' }])
    }, 800)
  }

  return (
    <>
      {isOpen && (
        <div className="chatbot-window">
          <div className="cb-header">
            <img src="/bumblebee.png" alt="Bumblebee" className="cb-avatar" />
            <div>
              <h4>Bumblebee</h4>
              <p>AI Assistant</p>
            </div>
            <button className="cb-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          <div className="cb-body">
            {messages.map((m, i) => (
              <div key={i} className={`cb-msg ${m.sender === 'user' ? 'cb-msg-user' : 'cb-msg-bot'}`}>{m.text}</div>
            ))}
          </div>
          <form className="cb-input-area" onSubmit={handleSend}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Ask for a recommendation..." />
            <button type="submit" disabled={!input.trim()}>Send</button>
          </form>
        </div>
      )}
      {!isOpen && (
        <button className="chatbot-fab" onClick={() => setIsOpen(true)}>
          <img src="/bumblebee.png" alt="Bumblebee AI" />
        </button>
      )}
    </>
  )
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loggedIn, setLoggedIn]   = useState(false)
  const [user, setUser]           = useState('')
  const [page, setPage]           = useState('dashboard')
  const [books, setBooks]         = useState([])
  const [members, setMembers]     = useState([])
  const [transactions, setTransactions] = useState([])
  const [dataLoaded, setDataLoaded] = useState(false)

  useEffect(() => {
    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9001/api';
    
    // Try to fetch from backend, fall back to initial mock data if backend not running
    Promise.all([
      fetch(`${API_URL}/books`).then(r => r.ok ? r.json() : Promise.reject()).catch(() => INITIAL_BOOKS),
      fetch(`${API_URL}/members`).then(r => r.ok ? r.json() : Promise.reject()).catch(() => INITIAL_MEMBERS),
      fetch(`${API_URL}/transactions`).then(r => r.ok ? r.json() : Promise.reject()).catch(() => INITIAL_TRANSACTIONS)
    ]).then(([b, m, t]) => {
      setBooks(b);
      setMembers(m);
      setTransactions(t);
      setDataLoaded(true);
    });
  }, []);
  const [toasts, setToasts]       = useState([])
  const [showNotif, setShowNotif] = useState(false)

  const addToast = useCallback((msg, type = 'success') => {
    const id = ++_toastId
    setToasts((prev) => [...prev, { id, msg, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500)
  }, [])
  const removeToast = useCallback((id) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const handleLogin = (u) => { setUser(u); setLoggedIn(true) }
  const handleLogout = () => { setLoggedIn(false); setUser(''); setPage('dashboard') }

  const handleNotify = useCallback((tx, member, book) => {
    setTransactions((prev) => prev.map((t) => t.id === tx.id ? { ...t, notified: true } : t))
    addToast(`📨 Reminder sent to ${member?.name} (${member?.email}) for "${book?.title}"`, 'success')
  }, [addToast])

  const handleNotifyAll = useCallback(() => {
    const pending = transactions.filter((t) => isOverdue(t.due, t.returned) && !t.notified)
    if (!pending.length) { addToast('All overdue members already notified.', 'warning'); return }
    setTransactions((prev) => prev.map((t) => isOverdue(t.due, t.returned) ? { ...t, notified: true } : t))
    addToast(`📨 Reminders sent to ${pending.length} member(s) with overdue books!`, 'success')
    setShowNotif(false)
  }, [transactions, addToast])

  useEffect(() => {
    if (loggedIn) {
      const count = transactions.filter((t) => isOverdue(t.due, t.returned)).length
      if (count > 0) setTimeout(() => addToast(`⚠️ ${count} book${count > 1 ? 's are' : ' is'} overdue. Click 🔔 to notify members.`, 'warning'), 1200)
    }
  }, [loggedIn]) // eslint-disable-line

  const overdueCount = transactions.filter((t) => isOverdue(t.due, t.returned)).length

  const navItems = [
    { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'books',     icon: '📚', label: 'Books' },
    { id: 'members',   icon: '👥', label: 'Members' },
    { id: 'transactions', icon: '🔄', label: 'Transactions' },
  ]

  if (!loggedIn) return (
    <>
      <LoginPage onLogin={handleLogin} />
      <Toasts toasts={toasts} removeToast={removeToast} />
    </>
  )

  if (!dataLoaded) return (
    <div className="login-bg" style={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'100vh',color:'white',flexDirection:'column'}}>
      <div className="spinner" style={{width:40,height:40,borderWidth:4,marginBottom:20}}></div>
      <h2>Connecting to Backend...</h2>
      <p style={{opacity:0.7,marginTop:10}}>Attempting to connect to port 9001</p>
    </div>
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo-wrap">📖</div>
          <div>
            <p className="brand-name">LibraryHub</p>
            <p className="brand-tagline">Management System</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${page===item.id?'nav-item-active':''}`} onClick={()=>setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.id==='transactions' && overdueCount > 0 && <span className="nav-badge">{overdueCount}</span>}
            </button>
          ))}
        </nav>

        {overdueCount > 0 && (
          <div className="sidebar-alert">
            <p className="sa-title">🚨 {overdueCount} Overdue</p>
            <p className="sa-body">Send reminders now</p>
            <button className="btn btn-sm btn-warning" style={{marginTop:10,width:'100%'}} onClick={()=>setShowNotif(true)}>Notify Members</button>
          </div>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{user[0]?.toUpperCase()}</div>
            <div><p className="user-name">{user}</p><p className="user-role">Administrator</p></div>
          </div>
        </div>
      </aside>

      <div className="main-wrap">
        <Header page={page} overdueCount={overdueCount} setShowNotif={setShowNotif} user={user} onLogout={handleLogout} />
        <main className="main">
          {page==='dashboard'    && <Dashboard books={books} members={members} transactions={transactions} />}
          {page==='books'        && <Books books={books} setBooks={setBooks} transactions={transactions} setTransactions={setTransactions} members={members} />}
          {page==='members'      && <Members members={members} setMembers={setMembers} transactions={transactions} books={books} />}
          {page==='transactions' && <Transactions transactions={transactions} setTransactions={setTransactions} books={books} setBooks={setBooks} members={members} />}
        </main>
      </div>

      {showNotif && (
        <NotificationPanel transactions={transactions} books={books} members={members}
          onClose={()=>setShowNotif(false)} onNotify={handleNotify} onNotifyAll={handleNotifyAll} />
      )}
      <Chatbot books={books} />
      <Toasts toasts={toasts} removeToast={removeToast} />
    </div>
  )
}
