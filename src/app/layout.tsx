import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { ShellWrapper } from '@/components/shell/ShellWrapper'
import { AuthProvider, AuthRedirectHandler, AuthModal } from '@/components/auth'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Syne, Outfit } from 'next/font/google'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap'
})

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Algority',
  description: 'AI coaching tool for coding interview preparation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.ReactElement {
  return (
    <html lang="en" suppressHydrationWarning className={`${syne.variable} ${outfit.variable}`}>
      <body className="bg-neutral-50 text-neutral-900 dark:bg-black dark:text-neutral-100 font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Toaster position="bottom-right" />
          <AuthProvider>
            <Suspense fallback={null}>
              <AuthRedirectHandler />
            </Suspense>
            <AuthModal />
            <ShellWrapper>{children}</ShellWrapper>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
