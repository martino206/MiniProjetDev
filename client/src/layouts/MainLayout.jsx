import React from 'react'
import Navbar from '../components/common/Navbar.jsx'
import Footer from '../components/common/Footer.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function MainLayout({ children }) {
  const { user } = useAuth()
  return (
    <div className="min-h-screen flex flex-col bg-ink-50 dark:bg-ink-950">
      <Navbar />
      {/* Pushes content above mobile bottom nav */}
      <main className={`flex-1 ${user ? 'pb-16 md:pb-0' : ''}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
