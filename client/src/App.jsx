import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth }  from './context/AuthContext.jsx'
import { ThemeProvider }           from './context/ThemeContext.jsx'
import MainLayout                  from './layouts/MainLayout.jsx'
import HomePage                    from './pages/HomePage.jsx'
import LoginPage                   from './pages/LoginPage.jsx'
import SignupPage                  from './pages/SignupPage.jsx'
import ArticlePage                 from './pages/ArticlePage.jsx'
import ArticleEditorPage           from './pages/ArticleEditorPage.jsx'
import DashboardPage               from './pages/DashboardPage.jsx'
import AdminPage                   from './pages/AdminPage.jsx'
import ProfilePage                 from './pages/ProfilePage.jsx'
import { PageLoader }              from './components/common/Spinner.jsx'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <PageLoader />
  if (!user)   return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const location = useLocation()
  if (loading)  return <PageLoader />
  if (!user)    return <Navigate to="/login" state={{ from: location }} replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user)    return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"              element={<MainLayout><HomePage /></MainLayout>} />
      <Route path="/articles/:slug" element={<MainLayout><ArticlePage /></MainLayout>} />
      <Route path="/u/:username"   element={<MainLayout><ProfilePage /></MainLayout>} />

      {/* Guest only */}
      <Route path="/login"  element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />

      {/* Auth required */}
      <Route path="/dashboard"        element={<PrivateRoute><MainLayout><DashboardPage /></MainLayout></PrivateRoute>} />
      <Route path="/articles/new"     element={<PrivateRoute><MainLayout><ArticleEditorPage /></MainLayout></PrivateRoute>} />
      <Route path="/articles/:id/edit" element={<PrivateRoute><MainLayout><ArticleEditorPage /></MainLayout></PrivateRoute>} />

      {/* Admin only */}
      <Route path="/admin" element={<AdminRoute><MainLayout><AdminPage /></MainLayout></AdminRoute>} />

      {/* 404 */}
      <Route path="*" element={
        <MainLayout>
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
            <p className="font-display text-8xl font-bold text-ink-100 dark:text-ink-800 mb-4 select-none">404</p>
            <h1 className="font-display text-2xl font-bold mb-2">Page introuvable</h1>
            <p className="text-ink-500 mb-7 text-sm">La page que vous cherchez n'existe pas ou a été déplacée.</p>
            <a href="/" className="btn-primary">Retour à l'accueil</a>
          </div>
        </MainLayout>
      } />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
