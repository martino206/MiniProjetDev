import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { User, Camera, Lock, FileText, Bookmark, PenSquare, Trash2, Edit2, Eye, Heart, MessageSquare, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { usersAPI, articlesAPI } from '../services/api.jsx'
import { PageLoader } from '../components/common/Spinner.jsx'

const SRV = 'https://miniprojetdev.onrender.com'
const src = s => (!s ? null : s.startsWith('http') ? s : `${SRV}${s}`)

const TABS = [
  { id: 'profile',   label: 'Profil',    icon: User },
  { id: 'articles',  label: 'Articles',  icon: FileText },
  { id: 'bookmarks', label: 'Favoris',   icon: Bookmark },
  { id: 'password',  label: 'Sécurité',  icon: Lock },
]

export default function DashboardPage() {
  const { user, updateUser }   = useAuth()
  const [tab, setTab]          = useState('profile')
  const [profile, setProfile]  = useState({ full_name: user?.full_name || '', bio: user?.bio || '' })
  const [pwdForm, setPwdForm]  = useState({ current_password: '', new_password: '', confirm: '' })
  const [articles, setArticles]  = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [busy, setBusy]          = useState(false)
  const [loading, setLoading]    = useState(false)
  const [msg, setMsg]            = useState({ type: '', text: '' })
  const avatarRef = useRef()

  const flash = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg({ type: '', text: '' }), 3500) }

  useEffect(() => {
    if (tab === 'articles') {
      setLoading(true)
      articlesAPI.getMyArticles({ limit: 50 }).then(({ data }) => setArticles(data.articles || [])).finally(() => setLoading(false))
    }
    if (tab === 'bookmarks') {
      setLoading(true)
      articlesAPI.getBookmarks().then(({ data }) => setBookmarks(data.articles || [])).finally(() => setLoading(false))
    }
  }, [tab])

  const saveProfile = async e => {
    e.preventDefault(); setBusy(true)
    try {
      const { data } = await usersAPI.updateProfile(profile)
      updateUser(data.user); flash('success', 'Profil mis à jour !')
    } catch (err) { flash('error', err.response?.data?.message || 'Erreur') }
    setBusy(false)
  }

  const changeAvatar = async e => {
    const f = e.target.files[0]; if (!f) return
    if (f.size > 5 * 1024 * 1024) { flash('error', 'Image trop grande (max 5 MB)'); return }
    const fd = new FormData(); fd.append('avatar', f)
    try { const { data } = await usersAPI.updateAvatar(fd); updateUser({ avatar: data.avatar }); flash('success', 'Photo mise à jour !') }
    catch { flash('error', 'Erreur lors du téléchargement') }
  }

  const savePwd = async e => {
    e.preventDefault()
    if (pwdForm.new_password !== pwdForm.confirm) { flash('error', 'Les mots de passe ne correspondent pas'); return }
    setBusy(true)
    try {
      await usersAPI.changePassword({ current_password: pwdForm.current_password, new_password: pwdForm.new_password })
      setPwdForm({ current_password: '', new_password: '', confirm: '' }); flash('success', 'Mot de passe modifié !')
    } catch (err) { flash('error', err.response?.data?.message || 'Erreur') }
    setBusy(false)
  }

  const delArticle = async id => {
    if (!window.confirm('Supprimer cet article ?')) return
    try { await articlesAPI.delete(id); setArticles(p => p.filter(a => a.id !== id)); flash('success', 'Article supprimé') } catch {}
  }

  const avatarSrc = src(user?.avatar)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-display text-2xl sm:text-3xl font-bold mb-8">Mon espace</h1>

      {msg.text && (
        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6 text-sm border ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-700 border-red-200 dark:border-red-800'}`}>
          {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
        </div>
      )}

      {/* Tab strip */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none mb-8 bg-ink-100 dark:bg-ink-800 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 shadow-sm' : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── PROFILE ── */}
      {tab === 'profile' && (
        <div className="card p-5 sm:p-7">
          {/* Avatar */}
          <div className="flex items-center gap-5 mb-7 pb-7 border-b border-ink-100 dark:border-ink-800">
            <div className="relative shrink-0">
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-ink-100 dark:border-ink-800" />
                : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-amber-500 flex items-center justify-center text-white text-3xl font-bold">{(user?.full_name || user?.username || '?')[0].toUpperCase()}</div>
              }
              <button onClick={() => avatarRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white dark:bg-ink-800 border border-ink-200 dark:border-ink-700 rounded-full flex items-center justify-center shadow-sm hover:bg-ink-50 dark:hover:bg-ink-700 transition-colors">
                <Camera size={13} className="text-ink-600 dark:text-ink-400" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" onChange={changeAvatar} className="hidden" />
            </div>
            <div>
              <p className="font-semibold text-lg">{user?.full_name || user?.username}</p>
              <p className="text-sm text-ink-500">@{user?.username}</p>
              <p className="text-xs text-ink-400 mt-1">Cliquez sur l'icône pour changer votre photo</p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-5 max-w-lg">
            <div>
              <label className="label">Nom complet</label>
              <input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                className="input" maxLength={100} placeholder="Votre nom complet" />
            </div>
            <div>
              <label className="label">Biographie</label>
              <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                className="textarea" rows={3} maxLength={500} placeholder="Quelques mots sur vous…" />
              <p className="text-xs text-ink-400 mt-1">{profile.bio.length}/500</p>
            </div>
            <button type="submit" disabled={busy} className="btn-primary btn-md">
              <Save size={15} /> {busy ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </form>
        </div>
      )}

      {/* ── ARTICLES ── */}
      {tab === 'articles' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">Mes articles ({articles.length})</h2>
            <Link to="/articles/new" className="btn-amber btn-sm"><PenSquare size={14} /> Écrire</Link>
          </div>
          {loading ? <PageLoader /> : articles.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText size={32} className="text-ink-200 dark:text-ink-700 mx-auto mb-3" />
              <p className="text-ink-500 mb-4 text-sm">Vous n'avez pas encore écrit d'article.</p>
              <Link to="/articles/new" className="btn-primary btn-sm">Écrire mon premier article</Link>
            </div>
          ) : articles.map(a => (
            <div key={a.id} className="card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${a.status === 'published' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'}`}>
                    {a.status === 'published' ? 'Publié' : 'Brouillon'}
                  </span>
                  <span className="text-xs text-ink-400">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <h3 className="font-medium text-ink-900 dark:text-ink-100 line-clamp-1 mb-2">{a.title}</h3>
                <div className="flex items-center gap-3 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Eye size={11} /> {a.views || 0}</span>
                  <span className="flex items-center gap-1"><Heart size={11} /> {a.likes_count || 0}</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {a.comments_count || 0}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Link to={`/articles/${a.id}/edit`} className="icon-btn text-blue-500"><Edit2 size={15} /></Link>
                <button onClick={() => delArticle(a.id)} className="icon-btn text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── BOOKMARKS ── */}
      {tab === 'bookmarks' && (
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Favoris ({bookmarks.length})</h2>
          {loading ? <PageLoader /> : bookmarks.length === 0 ? (
            <div className="card p-12 text-center">
              <Bookmark size={32} className="text-ink-200 dark:text-ink-700 mx-auto mb-3" />
              <p className="text-ink-500 text-sm">Aucun article sauvegardé.</p>
            </div>
          ) : bookmarks.map(a => (
            <Link key={a.id} to={`/articles/${a.slug}`} className="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow block group">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-ink-900 dark:text-ink-100 line-clamp-1 mb-1 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{a.title}</h3>
                {a.excerpt && <p className="text-sm text-ink-500 line-clamp-2">{a.excerpt}</p>}
                <p className="text-xs text-ink-400 mt-2">
                  {a.full_name || a.username} · {new Date(a.bookmarked_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              {a.cover_image && <img src={src(a.cover_image)} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />}
            </Link>
          ))}
        </div>
      )}

      {/* ── PASSWORD ── */}
      {tab === 'password' && (
        <div className="card p-5 sm:p-7">
          <h2 className="font-semibold text-lg mb-6">Changer le mot de passe</h2>
          <form onSubmit={savePwd} className="space-y-5 max-w-sm">
            {[
              { key: 'current_password', label: 'Mot de passe actuel',   auto: 'current-password' },
              { key: 'new_password',     label: 'Nouveau mot de passe',   auto: 'new-password', min: 8 },
              { key: 'confirm',          label: 'Confirmer le nouveau',   auto: 'new-password' },
            ].map(({ key, label, auto, min }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input type="password" required autoComplete={auto} minLength={min}
                  value={pwdForm[key]} onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                  className="input" placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" disabled={busy} className="btn-primary btn-md">
              <Lock size={15} /> {busy ? 'Modification…' : 'Changer le mot de passe'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
