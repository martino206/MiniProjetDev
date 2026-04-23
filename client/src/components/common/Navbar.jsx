import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sun, Moon, Bell, Search, PenSquare, User, LogOut,
  BookOpen, ChevronDown, LayoutDashboard, Shield, Home, X,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTheme } from '../../context/ThemeContext.jsx'
import { notificationsAPI } from '../../services/api.jsx'

const API = 'http://localhost:5000'

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth()
  const { dark, toggle }          = useTheme()
  const navigate   = useNavigate()
  const location   = useLocation()
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const [searchVal,   setSearchVal]   = useState('')
  const [notifs,      setNotifs]      = useState([])
  const [unread,      setUnread]      = useState(0)
  const menuRef  = useRef()
  const notifRef = useRef()
  const searchRef = useRef()

  useEffect(() => {
    if (!user) return
    notificationsAPI.getAll()
      .then(({ data }) => { setNotifs(data.notifications || []); setUnread(data.unread || 0) })
      .catch(() => {})
  }, [user, location.pathname])

  useEffect(() => {
    const h = (e) => {
      if (menuRef.current  && !menuRef.current.contains(e.target))  setMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // Close search on route change
  useEffect(() => { setSearchOpen(false); setSearchVal('') }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchVal.trim()
    if (q) { navigate(`/?search=${encodeURIComponent(q)}`); setSearchOpen(false); setSearchVal('') }
  }

  const markAllRead = async () => {
    await notificationsAPI.markAllRead()
    setUnread(0); setNotifs(p => p.map(n => ({ ...n, is_read: 1 })))
  }

  const avatarUrl = user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${API}${user.avatar}`) : null

  const Avatar = ({ size = 8 }) => avatarUrl
    ? <img src={avatarUrl} alt="" className={`w-${size} h-${size} rounded-full object-cover`} />
    : <div className={`w-${size} h-${size} rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs`}>{(user?.full_name || user?.username || '?')[0].toUpperCase()}</div>

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 bg-ink-50/90 dark:bg-ink-950/90 backdrop-blur-md border-b border-ink-100 dark:border-ink-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mr-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-ink-900 dark:bg-ink-100 flex items-center justify-center">
              <BookOpen size={14} className="text-ink-50 dark:text-ink-900" strokeWidth={2.5} />
            </div>
            <span className="font-display font-semibold text-lg text-ink-900 dark:text-ink-50 hidden xs:block">Blog</span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xs">
            <div className="relative w-full">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input type="text" placeholder="Rechercher…" value={searchVal} onChange={e => setSearchVal(e.target.value)}
                className="input py-2 pl-9 pr-4 text-sm" />
            </div>
          </form>

          <div className="flex-1 md:hidden" />

          {/* Right actions */}
          <div className="flex items-center gap-0.5">
            {/* Mobile search toggle */}
            <button onClick={() => setSearchOpen(s => !s)} className="icon-btn md:hidden">
              {searchOpen ? <X size={18} /> : <Search size={18} />}
            </button>

            {/* Theme */}
            <button onClick={toggle} className="icon-btn" title={dark ? 'Mode clair' : 'Mode sombre'}>
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {user ? (
              <>
                {/* Write — hidden on mobile (use bottom nav) */}
                <Link to="/articles/new" className="icon-btn hidden sm:flex" title="Écrire">
                  <PenSquare size={17} />
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button onClick={() => setNotifOpen(o => !o)} className="icon-btn relative">
                    <Bell size={17} />
                    {unread > 0 && (
                      <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] card shadow-2xl anim-slide-down">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100 dark:border-ink-800">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unread > 0 && <button onClick={markAllRead} className="text-xs text-amber-600 hover:text-amber-700">Tout lire</button>}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifs.length === 0
                          ? <p className="text-sm text-ink-400 text-center py-8">Aucune notification</p>
                          : notifs.map(n => (
                            <button key={n.id} onClick={() => { if (n.article_slug) navigate(`/articles/${n.article_slug}`); setNotifOpen(false) }}
                              className={`w-full text-left flex gap-3 px-4 py-3 border-b border-ink-50 dark:border-ink-800/50 last:border-0 hover:bg-ink-50 dark:hover:bg-ink-800/60 transition-colors ${!n.is_read ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                              <div className="w-8 h-8 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center shrink-0 text-xs font-bold text-ink-500">
                                {n.actor_username?.[0]?.toUpperCase() || '?'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-ink-700 dark:text-ink-300 leading-snug line-clamp-2">{n.message}</p>
                                <p className="text-[11px] text-ink-400 mt-1">{new Date(n.created_at).toLocaleDateString('fr-FR')}</p>
                              </div>
                              {!n.is_read && <div className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative ml-1" ref={menuRef}>
                  <button onClick={() => setMenuOpen(o => !o)} className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 hover:bg-ink-100 dark:hover:bg-ink-800 transition-colors">
                    <Avatar size={7} />
                    <ChevronDown size={13} className="text-ink-400 hidden sm:block" />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 card shadow-2xl py-1 anim-slide-down">
                      <div className="px-4 py-3 border-b border-ink-100 dark:border-ink-800">
                        <p className="text-sm font-semibold truncate">{user.full_name || user.username}</p>
                        <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      </div>
                      {[
                        { to: '/dashboard',         icon: LayoutDashboard, label: 'Tableau de bord' },
                        { to: `/u/${user.username}`, icon: User,             label: 'Mon profil' },
                        { to: '/articles/new',       icon: PenSquare,        label: 'Écrire' },
                      ].map(({ to, icon: Ic, label }) => (
                        <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-ink-700 dark:text-ink-300 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors">
                          <Ic size={15} className="text-ink-400" /> {label}
                        </Link>
                      ))}
                      {isAdmin && (
                        <Link to="/admin" onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors">
                          <Shield size={15} /> Administration
                        </Link>
                      )}
                      <div className="border-t border-ink-100 dark:border-ink-800 mt-1 pt-1">
                        <button onClick={() => { logout(); navigate('/'); setMenuOpen(false) }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
                          <LogOut size={15} /> Déconnexion
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link to="/login"  className="btn-ghost btn-sm hidden sm:flex">Connexion</Link>
                <Link to="/signup" className="btn-primary btn-sm">S'inscrire</Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 anim-slide-down">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
                <input ref={searchRef} autoFocus type="text" placeholder="Rechercher des articles…"
                  value={searchVal} onChange={e => setSearchVal(e.target.value)}
                  className="input pl-9 text-sm" />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* ── Mobile bottom navigation ── */}
      {user && (
        <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-ink-50/95 dark:bg-ink-950/95 backdrop-blur-md border-t border-ink-100 dark:border-ink-800 safe-bottom">
          <div className="flex items-center justify-around h-14 px-2">
            {[
              { to: '/',             icon: Home,        label: 'Accueil' },
              { to: '/articles/new', icon: PenSquare,   label: 'Écrire' },
              { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
              { to: `/u/${user.username}`, icon: User,  label: 'Profil' },
            ].map(({ to, icon: Ic, label }) => {
              const active = location.pathname === to
              return (
                <Link key={to} to={to} className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${active ? 'text-amber-600 dark:text-amber-400' : 'text-ink-500 dark:text-ink-400'}`}>
                  <Ic size={20} strokeWidth={active ? 2.5 : 1.75} />
                  <span className="text-[10px] font-medium">{label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </>
  )
}
