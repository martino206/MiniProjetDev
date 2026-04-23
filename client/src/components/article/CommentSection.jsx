import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Send, Trash2, CornerDownRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { articlesAPI } from '../../services/api.jsx'

const SRV = 'http://localhost:5000'
const src = (s) => (!s ? null : s.startsWith('http') ? s : `${SRV}${s}`)

function Av({ u, size = 8 }) {
  const s = src(u.avatar)
  return s
    ? <img src={s} alt="" className={`w-${size} h-${size} rounded-full object-cover shrink-0`} />
    : <div className={`w-${size} h-${size} rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs shrink-0`}>{(u.full_name || u.username || '?')[0].toUpperCase()}</div>
}

function CommentItem({ c, articleId, onDelete, onReply }) {
  const { user, isAdmin } = useAuth()
  const [open, setOpen]   = useState(false)
  const [text, setText]   = useState('')
  const [busy, setBusy]   = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const { data } = await articlesAPI.addComment(articleId, { content: text.trim(), parent_id: c.id })
      onReply(c.id, data.comment)
      setText(''); setOpen(false)
    } catch {}
    setBusy(false)
  }

  const canDel = user && (user.id === c.user_id || isAdmin)

  return (
    <div className="flex gap-3">
      <Av u={c} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
          <Link to={`/u/${c.username}`} className="text-sm font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">{c.full_name || c.username}</Link>
          <span className="text-xs text-ink-400">{new Date(c.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</span>
        </div>
        <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{c.content}</p>
        <div className="flex items-center gap-4 mt-2">
          {user && <button onClick={() => setOpen(o => !o)} className="text-xs text-ink-400 hover:text-amber-600 transition-colors flex items-center gap-1"><CornerDownRight size={11} /> Répondre</button>}
          {canDel && <button onClick={() => onDelete(c.id)} className="text-xs text-ink-400 hover:text-red-500 transition-colors flex items-center gap-1"><Trash2 size={11} /> Supprimer</button>}
        </div>

        {open && (
          <form onSubmit={submit} className="mt-3 flex gap-2">
            <input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="Répondre…" className="input text-sm py-2 flex-1" />
            <button type="submit" disabled={busy || !text.trim()} className="btn-amber btn-sm shrink-0"><Send size={13} /></button>
          </form>
        )}

        {c.replies?.length > 0 && (
          <div className="mt-4 space-y-4 pl-4 border-l-2 border-ink-100 dark:border-ink-800">
            {c.replies.map(r => (
              <div key={r.id} className="flex gap-2.5">
                <Av u={r} size={6} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 mb-0.5">
                    <Link to={`/u/${r.username}`} className="text-xs font-semibold hover:text-amber-700 dark:hover:text-amber-400 transition-colors">{r.full_name || r.username}</Link>
                    <span className="text-[11px] text-ink-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm text-ink-700 dark:text-ink-300 leading-relaxed">{r.content}</p>
                  {(user?.id === r.user_id || isAdmin) && (
                    <button onClick={() => onDelete(r.id)} className="text-xs text-ink-400 hover:text-red-500 transition-colors flex items-center gap-1 mt-1.5"><Trash2 size={10} /> Supprimer</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ article, onAdded }) {
  const { user }    = useAuth()
  const [text, setText]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [comments, setComments] = useState(article.comments || [])

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    try {
      const { data } = await articlesAPI.addComment(article.id, { content: text.trim() })
      setComments(p => [{ ...data.comment, replies: [] }, ...p])
      setText(''); onAdded?.()
    } catch {}
    setBusy(false)
  }

  const del = async (id) => {
    try {
      await articlesAPI.deleteComment(id)
      setComments(p => p.filter(c => c.id !== id).map(c => ({ ...c, replies: (c.replies || []).filter(r => r.id !== id) })))
    } catch {}
  }

  const addReply = (parentId, reply) =>
    setComments(p => p.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c))

  return (
    <section id="comments" className="mt-14 pt-10 border-t border-ink-100 dark:border-ink-800">
      <h2 className="font-display text-xl font-semibold mb-8 flex items-center gap-2">
        <MessageSquare size={20} />
        {comments.length} commentaire{comments.length !== 1 ? 's' : ''}
      </h2>

      {user ? (
        <form onSubmit={submit} className="mb-10 flex gap-3 items-start">
          <Av u={user} size={9} />
          <div className="flex-1 flex gap-2">
            <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Partagez votre avis…"
              rows={2} className="textarea flex-1 text-sm" />
            <button type="submit" disabled={busy || !text.trim()} className="btn-amber btn-sm self-end shrink-0 px-3">
              <Send size={14} />
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-10 p-5 bg-ink-50 dark:bg-ink-900 rounded-2xl text-center border border-ink-100 dark:border-ink-800">
          <p className="text-sm text-ink-500 mb-3">Connectez-vous pour commenter.</p>
          <Link to="/login" className="btn-primary btn-sm">Se connecter</Link>
        </div>
      )}

      <div className="space-y-7">
        {comments.map(c => <CommentItem key={c.id} c={c} articleId={article.id} onDelete={del} onReply={addReply} />)}
        {comments.length === 0 && <p className="text-center text-sm text-ink-400 py-10">Soyez le premier à commenter !</p>}
      </div>
    </section>
  )
}
