import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Save, Eye, ArrowLeft, X, AlertCircle, CheckCircle } from 'lucide-react'
import { articlesAPI, categoriesAPI } from '../services/api.jsx'
import { PageLoader } from '../components/common/Spinner.jsx'

const SRV = 'https://miniprojetdev.onrender.com'

export default function ArticleEditorPage() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const fileRef  = useRef()

  const [form, setForm]     = useState({ title: '', excerpt: '', content: '', status: 'draft', category_ids: [] })
  const [cover, setCover]   = useState(null)
  const [preview, setPreview] = useState('')
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(false)
  const [initLoading, setInit]      = useState(false)
  const [msg, setMsg]               = useState({ type: '', text: '' })

  useEffect(() => { categoriesAPI.getAll().then(({ data }) => setCategories(data.categories || [])) }, [])

  useEffect(() => {
    if (!id) return
    setInit(true)
    articlesAPI.getAll({ limit: 200, status: 'published' })
      .then(({ data }) => {
        const a = (data.articles || []).find(a => String(a.id) === String(id))
        if (a) {
          setForm(f => ({ ...f, title: a.title || '', excerpt: a.excerpt || '', status: a.status || 'draft' }))
          if (a.cover_image) setPreview(a.cover_image.startsWith('http') ? a.cover_image : `${SRV}${a.cover_image}`)
        }
      })
      .finally(() => setInit(false))
  }, [id])

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const toggleCat = catId => setForm(f => ({
    ...f,
    category_ids: f.category_ids.includes(catId) ? f.category_ids.filter(c => c !== catId) : [...f.category_ids, catId],
  }))

  const onFile = e => {
    const f = e.target.files[0]
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setMsg({ type: 'error', text: 'Image trop grande (max 5 MB)' }); return }
    setCover(f); setPreview(URL.createObjectURL(f))
  }

  const save = async (statusOverride) => {
    setMsg({ type: '', text: '' })
    if (!form.title.trim())   { setMsg({ type: 'error', text: 'Le titre est requis' });   return }
    if (!form.content.trim()) { setMsg({ type: 'error', text: 'Le contenu est requis' }); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('title',        form.title.trim())
      fd.append('excerpt',      form.excerpt.trim())
      fd.append('content',      form.content.trim())
      fd.append('status',       statusOverride || form.status)
      fd.append('category_ids', JSON.stringify(form.category_ids))
      if (cover) fd.append('cover_image', cover)

      if (id) {
        await articlesAPI.update(id, fd)
        setMsg({ type: 'success', text: 'Article mis à jour !' })
      } else {
        const { data } = await articlesAPI.create(fd)
        setMsg({ type: 'success', text: 'Article publié !' })
        if (data.slug) setTimeout(() => navigate(`/articles/${data.slug}`), 900)
      }
    } catch (err) {
      const errs = err.response?.data?.errors
      setMsg({ type: 'error', text: errs ? errs.map(e => e.msg).join(' — ') : err.response?.data?.message || 'Erreur' })
    }
    setLoading(false)
  }

  if (initLoading) return <PageLoader />

  const words   = form.content.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(Boolean).length
  const readMin = Math.max(1, Math.ceil(words / 200))

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 mb-8 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="icon-btn"><ArrowLeft size={18} /></button>
          <div>
            <h1 className="font-display text-lg sm:text-xl font-bold">{id ? "Modifier l'article" : 'Nouvel article'}</h1>
            <p className="text-xs text-ink-400">{words} mots · ~{readMin} min</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => save('draft')}     disabled={loading} className="btn-secondary btn-sm"><Save size={14} /> <span className="hidden xs:inline">Brouillon</span></button>
          <button onClick={() => save('published')} disabled={loading} className="btn-amber btn-sm"><Eye size={14} /> {id ? 'Mettre à jour' : 'Publier'}</button>
        </div>
      </div>

      {/* Alerts */}
      {msg.text && (
        <div className={`flex items-center gap-2.5 rounded-xl px-4 py-3 mb-6 text-sm border ${msg.type === 'success' ? 'bg-green-50 dark:bg-green-950/30 text-green-700 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 text-red-700 border-red-200 dark:border-red-800'}`}>
          {msg.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {msg.text}
        </div>
      )}

      <div className="space-y-7">
        {/* Cover */}
        <div>
          <p className="label mb-2">Image de couverture</p>
          {preview ? (
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] group">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => fileRef.current?.click()} className="btn-secondary btn-sm bg-white/90 hover:bg-white text-ink-900 border-0"><ImagePlus size={14} /> Changer</button>
                <button onClick={() => { setCover(null); setPreview('') }} className="btn-sm bg-white/90 hover:bg-white text-red-600 border-0 rounded-full"><X size={14} /></button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full h-40 sm:h-52 border-2 border-dashed border-ink-200 dark:border-ink-700 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 transition-all text-ink-400 hover:text-amber-600 group">
              <ImagePlus size={28} className="group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium">Ajouter une image de couverture</span>
              <span className="text-xs text-ink-400">JPEG, PNG, WebP — max 5 MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="hidden" />
        </div>

        {/* Title */}
        <div>
          <input name="title" value={form.title} onChange={handle} maxLength={255}
            placeholder="Titre de votre article…"
            className="w-full font-display text-2xl sm:text-3xl font-bold bg-transparent border-0 border-b-2 border-ink-100 dark:border-ink-800 focus:border-amber-500 focus:outline-none pb-3 text-ink-900 dark:text-ink-50 placeholder:text-ink-200 dark:placeholder:text-ink-800 transition-colors" />
          <p className="text-[11px] text-ink-400 text-right mt-1">{form.title.length}/255</p>
        </div>

        {/* Excerpt */}
        <div>
          <label className="label">Résumé <span className="normal-case text-ink-400 font-normal">(optionnel)</span></label>
          <textarea name="excerpt" value={form.excerpt} onChange={handle} rows={2} maxLength={500}
            placeholder="Un court résumé accrocheur…" className="textarea" />
        </div>

        {/* Categories */}
        <div>
          <label className="label">Catégories</label>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat.id} type="button" onClick={() => toggleCat(cat.id)}
                className={`text-sm px-3.5 py-1.5 rounded-full border transition-all ${form.category_ids.includes(cat.id) ? 'text-white border-transparent shadow-sm' : 'border-ink-200 dark:border-ink-700 text-ink-600 dark:text-ink-400 hover:border-ink-300 dark:hover:border-ink-600'}`}
                style={form.category_ids.includes(cat.id) ? { backgroundColor: cat.color, borderColor: cat.color } : {}}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div>
          <label className="label">Contenu <span className="text-red-500 normal-case">*</span> <span className="normal-case text-ink-400 font-normal">(HTML supporté)</span></label>
          <textarea name="content" value={form.content} onChange={handle} rows={22}
            placeholder={`Commencez à écrire votre article…\n\n<h2>Titre de section</h2>\n<p>Votre paragraphe ici…</p>\n<strong>Texte en gras</strong>\n<em>Texte en italique</em>\n<blockquote>Citation</blockquote>\n<code>code inline</code>`}
            className="textarea font-code text-sm resize-y min-h-[400px]" />
          <p className="text-xs text-ink-400 mt-1.5">{words} mots · lecture estimée {readMin} min</p>
        </div>

        {/* Status */}
        <div>
          <label className="label">Statut de publication</label>
          <div className="flex gap-3">
            {[{ v: 'draft', l: 'Brouillon' }, { v: 'published', l: 'Publié' }].map(({ v, l }) => (
              <label key={v} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border cursor-pointer transition-all select-none ${form.status === v ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300' : 'border-ink-200 dark:border-ink-700 text-ink-500 hover:bg-ink-50 dark:hover:bg-ink-800'}`}>
                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${form.status === v ? 'border-amber-500' : 'border-ink-300 dark:border-ink-600'}`}>
                  {form.status === v && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </div>
                <input type="radio" name="status" value={v} checked={form.status === v} onChange={handle} className="sr-only" />
                <span className="text-sm font-medium">{l}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-100 dark:border-ink-800">
          <button onClick={() => navigate(-1)} className="btn-secondary btn-md">Annuler</button>
          <button onClick={() => save('draft')}     disabled={loading} className="btn-secondary btn-md"><Save size={15} /> Brouillon</button>
          <button onClick={() => save('published')} disabled={loading} className="btn-amber btn-md"><Eye size={15} /> {id ? 'Mettre à jour' : 'Publier'}</button>
        </div>
      </div>
    </div>
  )
}
