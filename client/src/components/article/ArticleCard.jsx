import React from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageSquare, Bookmark, Clock, Eye } from 'lucide-react'

const SRV = 'https://miniprojetdev.onrender.com'
const src = (s) => (!s ? null : s.startsWith('http') ? s : `${SRV}${s}`)

export default function ArticleCard({ article, onLike, onBookmark }) {
  const cover   = src(article.cover_image)
  const avatar  = src(article.avatar)
  const cats    = Array.isArray(article.categories)      ? article.categories      : []
  const colors  = Array.isArray(article.category_colors) ? article.category_colors : []

  return (
    <article className="card-hover group flex flex-col">
      {/* Cover */}
      {cover && (
        <Link to={`/articles/${article.slug}`} className="block overflow-hidden aspect-[16/9] shrink-0">
          <img src={cover} alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        </Link>
      )}

      <div className="flex flex-col flex-1 p-5">
        {/* Categories */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {cats.slice(0, 2).map((cat, i) => (
              <Link key={i} to={`/?category=${encodeURIComponent(cat.toLowerCase())}`}
                className="tag text-[11px]"
                style={{ backgroundColor: (colors[i] || '#d97706') + '18', color: colors[i] || '#d97706' }}>
                {cat}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/articles/${article.slug}`} className="flex-1">
          <h2 className="font-display text-[1.05rem] sm:text-[1.1rem] font-semibold text-ink-900 dark:text-ink-100 leading-snug mb-2 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
            {article.title}
          </h2>
        </Link>

        {article.excerpt && (
          <p className="text-sm text-ink-500 dark:text-ink-400 line-clamp-2 leading-relaxed mb-4">
            {article.excerpt}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-ink-50 dark:border-ink-800">
          <Link to={`/u/${article.username}`} className="flex items-center gap-2 min-w-0 group/author">
            {avatar
              ? <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
              : <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{(article.full_name || article.username || '?')[0].toUpperCase()}</div>
            }
            <div className="min-w-0">
              <p className="text-xs font-medium text-ink-700 dark:text-ink-300 truncate group-hover/author:text-amber-700 dark:group-hover/author:text-amber-400 transition-colors">
                {article.full_name || article.username}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-ink-400">
                <span>{new Date(article.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}</span>
                <span>·</span>
                <span className="flex items-center gap-0.5"><Clock size={9} /> {article.reading_time} min</span>
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => onLike?.(article.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${article.liked ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-ink-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20'}`}>
              <Heart size={12} fill={article.liked ? 'currentColor' : 'none'} />
              <span>{article.likes_count || 0}</span>
            </button>
            <Link to={`/articles/${article.slug}#comments`}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-ink-400 hover:text-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800 transition-all">
              <MessageSquare size={12} />
              <span>{article.comments_count || 0}</span>
            </Link>
            <button onClick={() => onBookmark?.(article.id)}
              className={`p-1.5 rounded-full text-xs transition-all ${article.bookmarked ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' : 'text-ink-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'}`}>
              <Bookmark size={12} fill={article.bookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
