import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, Heart, MessageSquare, Shield, Search, Trash2, ToggleLeft, ToggleRight, Eye, TrendingUp, Plus, X } from 'lucide-react'
import { usersAPI, articlesAPI, categoriesAPI } from '../services/api.jsx'
import { PageLoader } from '../components/common/Spinner.jsx'

const TABS = [
  { id: 'overview',   label: 'Vue d\'ensemble', icon: TrendingUp },
  { id: 'users',      label: 'Utilisateurs',    icon: Users },
  { id: 'articles',   label: 'Articles',         icon: FileText },
  { id: 'categories', label: 'Catégories',       icon: Shield },
]

const SRV = 'http://localhost:5000'

function Stat({ label, value, icon: Icon, color }) {
  const bg = { amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600', green: 'bg-green-50 dark:bg-green-950/30 text-green-600', blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600', red: 'bg-red-50 dark:bg-red-950/30 text-red-600' }
  return (
    <div className="card p-4 sm:p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${bg[color]}`}><Icon size={20} /></div>
      <div><p className="text-2xl font-bold font-display">{value}</p><p className="text-xs text-ink-500">{label}</p></div>
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab]           = useState('overview')
  const [stats, setStats]       = useState(null)
  const [users, setUsers]       = useState([])
  const [articles, setArticles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState('')
  const [newCat, setNewCat]     = useState({ name: '', color: '#d97706' })
  const [catBusy, setCatBusy]   = useState(false)

  useEffect(() => {
    setLoading(true)
    const load = {
      overview:   () => categoriesAPI.getStats().then(({ data }) => setStats(data)),
      users:      () => usersAPI.getAll({ limit: 100 }).then(({ data }) => setUsers(data.users || [])),
      articles:   () => articlesAPI.getAll({ limit: 100, status: 'published' }).then(({ data }) => setArticles(data.articles || [])),
      categories: () => categoriesAPI.getAll().then(({ data }) => setCategories(data.categories || [])),
    }
    load[tab]?.().finally(() => setLoading(false))
  }, [tab])

  const toggleUser   = async id => { try { await usersAPI.toggleStatus(id); setUsers(p => p.map(u => u.id === id ? { ...u, is_active: u.is_active ? 0 : 1 } : u)) } catch {} }
  const deleteUser   = async id => { if (!window.confirm('Supprimer cet utilisateur ?')) return; try { await usersAPI.delete(id); setUsers(p => p.filter(u => u.id !== id)) } catch {} }
  const deleteArticle = async id => { if (!window.confirm('Supprimer cet article ?')) return; try { await articlesAPI.delete(id); setArticles(p => p.filter(a => a.id !== id)) } catch {} }
  const deleteCat    = async id => { if (!window.confirm('Supprimer cette catégorie ?')) return; try { await categoriesAPI.delete(id); setCategories(p => p.filter(c => c.id !== id)) } catch {} }

  const addCat = async e => {
    e.preventDefault(); if (!newCat.name.trim()) return; setCatBusy(true)
    try { await categoriesAPI.create(newCat); const { data } = await categoriesAPI.getAll(); setCategories(data.categories || []); setNewCat({ name: '', color: '#d97706' }) } catch {}
    setCatBusy(false)
  }

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-ink-900 dark:bg-ink-100 flex items-center justify-center shrink-0">
          <Shield size={18} className="text-white dark:text-ink-900" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Administration</h1>
          <p className="text-sm text-ink-500">Gérez les utilisateurs, articles et catégories</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-none mb-8 bg-ink-100 dark:bg-ink-800 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-ink-100 shadow-sm' : 'text-ink-500 hover:text-ink-800 dark:hover:text-ink-200'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (loading ? <PageLoader /> : stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Utilisateurs" value={stats.stats?.users    || 0} icon={Users}        color="blue"  />
            <Stat label="Articles"     value={stats.stats?.articles || 0} icon={FileText}      color="green" />
            <Stat label="Commentaires" value={stats.stats?.comments || 0} icon={MessageSquare} color="amber" />
            <Stat label="Likes"        value={stats.stats?.likes    || 0} icon={Heart}         color="red"   />
          </div>
          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold mb-5">Articles les plus vus</h2>
            <div className="space-y-4">
              {(stats.topArticles || []).map((a, i) => (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-ink-100 dark:bg-ink-800 flex items-center justify-center text-xs font-bold text-ink-400 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <Link to={`/articles/${a.slug}`} className="text-sm font-medium hover:text-amber-700 dark:hover:text-amber-400 transition-colors truncate block">{a.title}</Link>
                    <p className="text-xs text-ink-400">{a.full_name || a.username}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold flex items-center gap-1 justify-end"><Eye size={12} /> {a.views}</p>
                    <p className="text-xs text-ink-400 flex items-center gap-1 justify-end"><Heart size={11} /> {a.likes_count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* USERS */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" className="input pl-9 text-sm" />
            </div>
            <span className="text-sm text-ink-500 shrink-0">{filtered.length} utilisateur{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          {loading ? <PageLoader /> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-700">
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500">Utilisateur</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500 hidden md:table-cell">Email</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500">Statut</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(u => (
                      <tr key={u.id} className="border-b border-ink-50 dark:border-ink-800 last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            {u.avatar
                              ? <img src={`${SRV}${u.avatar}`} alt="" className="w-7 h-7 rounded-full object-cover" />
                              : <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold">{(u.full_name || u.username)[0].toUpperCase()}</div>
                            }
                            <div>
                              <p className="font-medium text-sm">{u.full_name || u.username}</p>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${u.role_name === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-ink-100 dark:bg-ink-700 text-ink-500 dark:text-ink-400'}`}>{u.role_name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink-500 text-sm hidden md:table-cell">{u.email}</td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {u.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => toggleUser(u.id)} className={`icon-btn ${u.is_active ? 'text-green-500' : 'text-ink-400'}`} title={u.is_active ? 'Désactiver' : 'Activer'}>
                              {u.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </button>
                            <button onClick={() => deleteUser(u.id)} className="icon-btn text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filtered.length === 0 && <p className="text-center text-ink-400 py-10 text-sm">Aucun utilisateur trouvé</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ARTICLES */}
      {tab === 'articles' && (
        <div className="space-y-4">
          <h2 className="font-semibold">{articles.length} articles publiés</h2>
          {loading ? <PageLoader /> : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="bg-ink-50 dark:bg-ink-800 border-b border-ink-100 dark:border-ink-700">
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500">Article</th>
                      <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500 hidden sm:table-cell">Auteur</th>
                      <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wide text-ink-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {articles.map(a => (
                      <tr key={a.id} className="border-b border-ink-50 dark:border-ink-800 last:border-0 hover:bg-ink-50/50 dark:hover:bg-ink-800/30 transition-colors">
                        <td className="px-4 py-3.5">
                          <Link to={`/articles/${a.slug}`} className="font-medium hover:text-amber-700 dark:hover:text-amber-400 transition-colors line-clamp-1">{a.title}</Link>
                          <div className="flex items-center gap-3 mt-1 text-xs text-ink-400">
                            <span className="flex items-center gap-1"><Eye size={10} /> {a.views}</span>
                            <span className="flex items-center gap-1"><Heart size={10} /> {a.likes_count}</span>
                            <span>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-ink-500 text-sm hidden sm:table-cell">{a.full_name || a.username}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Link to={`/articles/${a.slug}`} className="icon-btn text-blue-400 hover:text-blue-600"><Eye size={15} /></Link>
                            <button onClick={() => deleteArticle(a.id)} className="icon-btn text-red-400 hover:text-red-600"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CATEGORIES */}
      {tab === 'categories' && (
        <div className="space-y-6">
          <div className="card p-5 sm:p-6">
            <h2 className="font-semibold mb-4">Ajouter une catégorie</h2>
            <form onSubmit={addCat} className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <label className="label">Nom</label>
                <input value={newCat.name} onChange={e => setNewCat(n => ({ ...n, name: e.target.value }))}
                  placeholder="Nouvelle catégorie" className="input" required />
              </div>
              <div>
                <label className="label">Couleur</label>
                <input type="color" value={newCat.color} onChange={e => setNewCat(n => ({ ...n, color: e.target.value }))}
                  className="h-10 w-14 cursor-pointer rounded-xl border border-ink-200 dark:border-ink-700 p-1" />
              </div>
              <button type="submit" disabled={catBusy} className="btn-amber btn-md shrink-0"><Plus size={15} /> Ajouter</button>
            </form>
          </div>
          {loading ? <PageLoader /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(cat => (
                <div key={cat.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: cat.color + '20' }}>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{cat.name}</p>
                      <p className="text-xs text-ink-400">{cat.article_count} article{cat.article_count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteCat(cat.id)} className="icon-btn text-red-400 hover:text-red-600 shrink-0"><X size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
