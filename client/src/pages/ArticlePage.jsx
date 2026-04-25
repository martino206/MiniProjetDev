import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Heart, Bookmark, Share2, Clock, Eye, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import { articlesAPI } from '../services/api.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import CommentSection from '../components/article/CommentSection.jsx'
import { PageLoader } from '../components/common/Spinner.jsx'

const SRV = 'https://miniprojetdev.onrender.com'
const src = (s) => {
  if (!s) return null;

  if (s.startsWith('http')) return s;

  return `${SRV}${s.startsWith('/') ? '' : '/'}${s}`;
};

export default function ArticlePage() {
  const { slug }          = useParams()
  const { user, isAdmin } = useAuth()
  const navigate          = useNavigate()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    setLoading(true)
    articlesAPI.getBySlug(slug)
      .then(({ data }) => setArticle(data.article))
      .catch(err => setError(err.response?.data?.message || 'Article introuvable'))
      .finally(() => setLoading(false))
  }, [slug])

  const toggleLike = async () => {
    if (!user) return navigate('/login')
    try {
      const { data } = await articlesAPI.toggleLike(article.id)
      setArticle(p => ({ ...p, liked: data.liked, likes_count: data.liked ? p.likes_count + 1 : p.likes_count - 1 }))
    } catch {}
  }
  const toggleBookmark = async () => {
    if (!user) return navigate('/login')
    try {
      const { data } = await articlesAPI.toggleBookmark(article.id)
      setArticle(p => ({ ...p, bookmarked: data.bookmarked }))
    } catch {}
  }
  const handleDelete = async () => {
    if (!window.confirm('Supprimer cet article ?')) return
    try { await articlesAPI.delete(article.id); navigate('/') } catch {}
  }
  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <PageLoader />
  if (error)   return (
    <div className="max-w-xl mx-auto px-4 py-24 text-center">
      <p className="text-ink-500 mb-5">{error}</p>
      <Link to="/" className="btn-primary">Retour à l'accueil</Link>
    </div>
  )

  const canEdit   = user && (user.id === article.author_id || isAdmin)
  const avatarSrc = src(article.avatar)
  const coverSrc  = src(article.cover_image)

  return (
    <div className="anim-fade-up">
      {/* Cover */}
      {coverSrc && (
        <div className="w-full aspect-[21/9] max-h-[480px] overflow-hidden">
          <img src={coverSrc} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="btn-ghost btn-sm mb-6 -ml-2">
          <ArrowLeft size={15} /> Retour
        </button>

        {/* Header */}
        <header className="mb-8">
          {/* Categories */}
          {article.categories?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {article.categories.map(cat => (
                <Link key={cat.id} to={`/?category=${cat.slug}`}
                  className="tag text-xs" style={{ backgroundColor: cat.color + '18', color: cat.color }}>
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-ink-900 dark:text-ink-50 leading-tight mb-4 text-balance">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="text-base sm:text-lg text-ink-500 dark:text-ink-400 leading-relaxed mb-6">{article.excerpt}</p>
          )}

          {/* Author row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link to={`/u/${article.username}`} className="flex items-center gap-3 group">
              {avatarSrc
                ? <img src={avatarSrc} alt="" className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-ink-100 dark:border-ink-800" />
                : <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">{(article.full_name || article.username)[0].toUpperCase()}</div>
              }
              <div>
                <p className="text-sm font-semibold group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{article.full_name || article.username}</p>
                <div className="flex items-center gap-2 text-xs text-ink-400 flex-wrap">
                  <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {article.reading_time} min</span>
                  <span>·</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {article.views}</span>
                </div>
              </div>
            </Link>

            {/* Action buttons */}
            <div className="flex items-center gap-1 flex-wrap">
              <button onClick={toggleLike}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all ${article.liked ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-ink-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}>
                <Heart size={15} fill={article.liked ? 'currentColor' : 'none'} /> {article.likes_count}
              </button>
              <button onClick={toggleBookmark}
                className={`icon-btn ${article.bookmarked ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : ''}`}>
                <Bookmark size={16} fill={article.bookmarked ? 'currentColor' : 'none'} />
              </button>
              <button onClick={handleShare} className="icon-btn" title={copied ? 'Copié !' : 'Partager'}>
                <Share2 size={16} className={copied ? 'text-green-500' : ''} />
              </button>
              {canEdit && (
                <>
                  <Link to={`/articles/${article.id}/edit`} className="icon-btn text-blue-500"><Edit2 size={15} /></Link>
                  <button onClick={handleDelete} className="icon-btn text-red-500"><Trash2 size={15} /></button>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="border-t border-ink-100 dark:border-ink-800 mb-10" />

        {/* Article body */}
        <div className="article-prose" dangerouslySetInnerHTML={{ __html: article.content }} />

        {/* Author card */}
        <div className="mt-14 p-5 sm:p-6 card flex items-start gap-4 sm:gap-5">
          <Link to={`/u/${article.username}`} className="shrink-0">
            {avatarSrc
              ? <img src={avatarSrc} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover" />
              : <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500 flex items-center justify-center text-white text-2xl font-bold">{(article.full_name || article.username)[0].toUpperCase()}</div>
            }
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400 mb-1">Écrit par</p>
            <Link to={`/u/${article.username}`} className="font-display text-lg font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
              {article.full_name || article.username}
            </Link>
            {article.bio && <p className="text-sm text-ink-500 mt-1.5 leading-relaxed">{article.bio}</p>}
          </div>
        </div>

        {/* Comments */}
        <CommentSection article={article} onAdded={() => setArticle(p => ({ ...p, comments_count: (p.comments_count || 0) + 1 }))} />
      </div>
    </div>
  )
}
