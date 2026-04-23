import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, Calendar, BookOpen, Settings } from 'lucide-react'
import { usersAPI, articlesAPI } from '../services/api.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import ArticleCard from '../components/article/ArticleCard.jsx'
import { PageLoader } from '../components/common/Spinner.jsx'

const SRV = 'http://localhost:5000'
const src = s => (!s ? null : s.startsWith('http') ? s : `${SRV}${s}`)

export default function ProfilePage() {
  const { username }       = useParams()
  const { user: me }       = useAuth()
  const [profile, setProfile]   = useState(null)
  const [articles, setArticles] = useState([])
  const [loadP, setLoadP]       = useState(true)
  const [loadA, setLoadA]       = useState(false)

  useEffect(() => {
    setLoadP(true)
    usersAPI.getProfile(username).then(({ data }) => setProfile(data.user)).catch(() => setProfile(null)).finally(() => setLoadP(false))
  }, [username])

  useEffect(() => {
    if (!profile) return
    setLoadA(true)
    articlesAPI.getUserArticles(profile.id, { limit: 20, status: 'published' })
      .then(({ data }) => setArticles(data.articles || [])).finally(() => setLoadA(false))
  }, [profile])

  const toggleLike = async (id) => {
    if (!me) return
    try {
      const { data } = await articlesAPI.toggleLike(id)
      setArticles(p => p.map(a => a.id === id ? { ...a, liked: data.liked, likes_count: data.liked ? a.likes_count + 1 : a.likes_count - 1 } : a))
    } catch {}
  }
  const toggleBookmark = async (id) => {
    if (!me) return
    try {
      const { data } = await articlesAPI.toggleBookmark(id)
      setArticles(p => p.map(a => a.id === id ? { ...a, bookmarked: data.bookmarked } : a))
    } catch {}
  }

  if (loadP) return <PageLoader />
  if (!profile) return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-ink-500 mb-5">Utilisateur introuvable.</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  )

  const avatarSrc = src(profile.avatar)
  const isOwn     = me?.username === username

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 anim-fade-up">
      {/* ── Profile header ── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12 pb-12 border-b border-ink-100 dark:border-ink-800">
        {/* Avatar */}
        {avatarSrc
          ? <img src={avatarSrc} alt={profile.username} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-white dark:border-ink-900 shadow-lg shrink-0" />
          : <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-amber-500 flex items-center justify-center text-white text-4xl sm:text-5xl font-bold shadow-lg shrink-0">{(profile.full_name || profile.username)[0].toUpperCase()}</div>
        }

        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap mb-1">
            <h1 className="font-display text-2xl sm:text-3xl font-bold">{profile.full_name || profile.username}</h1>
            {profile.role_name === 'admin' && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold">Admin</span>
            )}
          </div>
          <p className="text-sm text-ink-500 mb-3">@{profile.username}</p>
          {profile.bio && <p className="text-sm text-ink-600 dark:text-ink-400 max-w-md leading-relaxed mb-4">{profile.bio}</p>}

          <div className="flex items-center justify-center sm:justify-start gap-5 text-sm text-ink-500 flex-wrap">
            <span className="flex items-center gap-1.5"><FileText size={14} /> {profile.article_count} article{profile.article_count !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1.5"><Calendar size={14} /> Depuis {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>

          {isOwn && (
            <div className="mt-5">
              <Link to="/dashboard" className="btn-secondary btn-sm"><Settings size={14} /> Modifier mon profil</Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Articles ── */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
          <BookOpen size={18} /> Articles de {profile.full_name || profile.username}
        </h2>
        {loadA ? <PageLoader /> : articles.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="mx-auto mb-3 text-ink-200 dark:text-ink-700" />
            <p className="text-ink-400 text-sm">Aucun article publié pour l'instant.</p>
            {isOwn && <Link to="/articles/new" className="btn-primary btn-sm mt-5 inline-flex">Écrire mon premier article</Link>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {articles.map(a => (
              <ArticleCard key={a.id} article={a} onLike={toggleLike} onBookmark={toggleBookmark} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
