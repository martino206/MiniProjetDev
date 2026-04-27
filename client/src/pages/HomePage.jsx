import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, ChevronLeft, ChevronRight, Tag, X, TrendingUp, Feather } from 'lucide-react'
import { articlesAPI, categoriesAPI } from '../services/api.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import ArticleCard from '../components/article/ArticleCard.jsx'
import { PageLoader, EmptyState } from '../components/common/Spinner.jsx'
import { useDebounce } from '../hooks/useDebounce.jsx'

export default function HomePage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles]         = useState([])
  const [categories, setCategories]     = useState([])
  const [loading, setLoading]           = useState(true)
  const [page, setPage]                 = useState(1)
  const [totalPages, setTotalPages]     = useState(1)
  const [total, setTotal]               = useState(0)

  const searchQuery    = searchParams.get('search')   || ''
  const categoryFilter = searchParams.get('category') || ''
  const debSearch      = useDebounce(searchQuery, 400)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await articlesAPI.getAll({ page, limit: 9, search: debSearch, category: categoryFilter })
      setArticles(data.articles || [])
      setTotalPages(data.pages || 1)
      setTotal(data.total || 0)
    } catch {}
    setLoading(false)
  }, [page, debSearch, categoryFilter])

  useEffect(() => { load() }, [load])
  useEffect(() => { categoriesAPI.getAll().then(({ data }) => setCategories(data.categories || [])) }, [])
  useEffect(() => { setPage(1) }, [debSearch, categoryFilter])

  const toggleLike = async (id) => {
    if (!user) return
    try {
      const { data } = await articlesAPI.toggleLike(id)
      setArticles(p => p.map(a => a.id === id
        ? { ...a, liked: data.liked, likes_count: data.liked ? a.likes_count + 1 : a.likes_count - 1 }
        : a))
    } catch {}
  }

  const toggleBookmark = async (id) => {
    if (!user) return
    try {
      const { data } = await articlesAPI.toggleBookmark(id)
      setArticles(p => p.map(a => a.id === id ? { ...a, bookmarked: data.bookmarked } : a))
    } catch {}
  }

  const setCategory = (slug) => {
    const p = new URLSearchParams(searchParams)
    categoryFilter === slug ? p.delete('category') : p.set('category', slug)
    p.delete('search')
    setSearchParams(p)
  }

  const clearSearch = () => {
    const p = new URLSearchParams(searchParams)
    p.delete('search')
    setSearchParams(p)
  }

  const isFiltered = searchQuery || categoryFilter

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

      {/* ── Hero ── */}
      {!isFiltered && (
        <div className="mb-12 sm:mb-16">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">Plateforme éditoriale</p>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-ink-900 dark:text-ink-50 leading-[1.15] mb-5 text-balance">
              Des idées qui<br />
              <em className="not-italic text-amber-600 dark:text-amber-500">méritent d'être lues</em>
            </h1>
            <p className="text-base sm:text-lg text-ink-500 dark:text-ink-400 max-w-lg leading-relaxed mb-7">
              Lisez, écrivez et partagez des histoires sur les sujets qui vous passionnent.
            </p>
            {!user && (
              <div className="flex flex-wrap gap-3">
                <Link to="/signup" className="btn-primary btn-lg">
                  <Feather size={17} /> Commencer à écrire
                </Link>
                <Link to="/login" className="btn-secondary btn-lg">Se connecter</Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Active filters banner ── */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-sm text-ink-500">{total} résultat{total !== 1 ? 's' : ''} pour :</span>
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-ink-100 dark:bg-ink-800 rounded-full text-sm">
              <Search size={12} className="text-ink-400" /> <strong>{searchQuery}</strong>
              <button onClick={clearSearch} className="ml-1 text-ink-400 hover:text-ink-700"><X size={12} /></button>
            </span>
          )}
          {categoryFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-sm">
              <Tag size={12} /> {categoryFilter}
              <button onClick={() => setCategory(categoryFilter)} className="ml-1 hover:opacity-70"><X size={12} /></button>
            </span>
          )}
        </div>
      )}

      <div className="flex gap-10">
        {/* ── Articles grid ── */}
        <div className="flex-1 min-w-0">
          {/* Category pills — mobile only */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2 mb-6 lg:hidden -mx-4 px-4">
            <button
              onClick={() => { const p = new URLSearchParams(searchParams); p.delete('category'); setSearchParams(p) }}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${!categoryFilter ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900 border-transparent' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400'}`}>
              Tous
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCategory(cat.slug)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap ${categoryFilter === cat.slug ? 'text-white border-transparent' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400'}`}
                style={categoryFilter === cat.slug ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <PageLoader />
          ) : articles.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Aucun article trouvé"
              description="Essayez avec d'autres mots-clés ou explorez d'autres catégories."
              action={<Link to="/" className="btn-primary btn-md">Voir tous les articles</Link>}
            />
          ) : (
            <>
              {/* First article — featured large */}
              {!isFiltered && page === 1 && articles[0] && (
                <div className="mb-8">
                  <FeaturedCard article={articles[0]} onLike={toggleLike} onBookmark={toggleBookmark} />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {((!isFiltered && page === 1) ? articles.slice(1) : articles).map(article => (
                  <ArticleCard key={article.id} article={article} onLike={toggleLike} onBookmark={toggleBookmark} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="icon-btn disabled:opacity-30 disabled:pointer-events-none">
                    <ChevronLeft size={18} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${page === p ? 'bg-ink-900 dark:bg-ink-100 text-white dark:text-ink-900' : 'text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="icon-btn disabled:opacity-30 disabled:pointer-events-none">
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden lg:flex flex-col gap-6 w-64 xl:w-72 shrink-0">
          {/* Categories */}
          <div className="card p-5">
            <h3 className="label mb-4">Catégories</h3>
            <div className="space-y-0.5">
              <button
                onClick={() => { const p = new URLSearchParams(searchParams); p.delete('category'); setSearchParams(p) }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${!categoryFilter ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-medium' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-ink-400" /> Tous les articles
                </span>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setCategory(cat.slug)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${categoryFilter === cat.slug ? 'font-medium' : 'text-ink-600 dark:text-ink-400 hover:bg-ink-50 dark:hover:bg-ink-800'}`}
                  style={categoryFilter === cat.slug ? { backgroundColor: cat.color + '15', color: cat.color } : {}}>
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    {cat.name}
                  </span>
                  <span className="text-[11px] text-ink-400 font-mono">{cat.article_count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CTA */}
          {!user && (
            <div className="card p-5 border-amber-200 dark:border-amber-800/50 bg-gradient-to-b from-amber-50 to-white dark:from-amber-950/30 dark:to-ink-900">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 mb-2">Rejoignez-nous</p>
              <h3 className="font-display text-lg font-semibold text-ink-900 dark:text-ink-100 mb-2 leading-snug">Publiez votre histoire</h3>
              <p className="text-xs text-ink-500 dark:text-ink-400 mb-4 leading-relaxed">Rejoignez des milliers d'auteurs et partagez vos idées avec le monde.</p>
              <Link to="/signup" className="btn-amber btn-sm w-full justify-center">Créer un compte</Link>
            </div>
          )}

          {/* Trending label */}
          <div className="flex items-center gap-2 text-xs text-ink-400 uppercase tracking-widest font-semibold px-1">
            <TrendingUp size={13} /> Tendances
          </div>
          {categories.slice(0, 3).map((cat, i) => (
            <button key={cat.id} onClick={() => setCategory(cat.slug)} className="text-left group">
              <div className="flex gap-3 items-center">
                <span className="text-2xl font-display font-bold text-ink-100 dark:text-ink-800 group-hover:text-ink-200 dark:group-hover:text-ink-700 transition-colors leading-none">0{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">{cat.name}</p>
                  <p className="text-xs text-ink-400">{cat.article_count} article{cat.article_count !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </button>
          ))}
        </aside>
      </div>
    </div>
  )
}

/* ── Featured large card ── */
function FeaturedCard({ article, onLike, onBookmark }) {
  const SRV   = 'https://miniprojetdev.onrender.com'
  const cover  = article.cover_image ? (article.cover_image.startsWith('http') ? article.cover_image : `${SRV}${article.cover_image}`) : null
  const avatar = article.avatar      ? (article.avatar.startsWith('http')      ? article.avatar      : `${SRV}${article.avatar}`)      : null
  const cats   = Array.isArray(article.categories)      ? article.categories      : []
  const colors = Array.isArray(article.category_colors) ? article.category_colors : []

  return (
    <article className="card-hover group overflow-hidden sm:flex sm:items-stretch">
      {cover && (
        <Link to={`/articles/${article.slug}`} className="block sm:w-2/5 overflow-hidden aspect-[16/9] sm:aspect-auto shrink-0">
          <img src={cover} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </Link>
      )}
      <div className={`flex flex-col justify-center p-6 sm:p-8 ${cover ? 'sm:w-3/5' : 'w-full'}`}>
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {cats.slice(0, 2).map((cat, i) => (
              <span key={i} className="tag text-xs" style={{ backgroundColor: (colors[i] || '#d97706') + '18', color: colors[i] || '#d97706' }}>{cat}</span>
            ))}
          </div>
        )}
        <Link to={`/articles/${article.slug}`}>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink-900 dark:text-ink-50 leading-snug mb-3 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-3">
            {article.title}
          </h2>
        </Link>
        {article.excerpt && <p className="text-sm text-ink-500 dark:text-ink-400 leading-relaxed mb-5 line-clamp-2">{article.excerpt}</p>}
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-ink-50 dark:border-ink-800">
          <Link to={`/u/${article.username}`} className="flex items-center gap-2.5">
            {avatar
              ? <img src={avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
              : <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{(article.full_name || article.username || '?')[0].toUpperCase()}</div>}
            <div>
              <p className="text-sm font-medium text-ink-700 dark:text-ink-300">{article.full_name || article.username}</p>
              <p className="text-xs text-ink-400">{new Date(article.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <button onClick={() => onLike?.(article.id)} className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs transition-all ${article.liked ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}>
              <span className={`text-base ${article.liked ? 'text-red-500' : ''}`}>♥</span> {article.likes_count || 0}
            </button>
            <button onClick={() => onBookmark?.(article.id)} className={`p-1.5 rounded-full transition-all ${article.bookmarked ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-ink-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'}`}>
              <span className="text-base">{article.bookmarked ? '🔖' : '🏷'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
