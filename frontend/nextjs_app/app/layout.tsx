import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ongoza CyberHub - We Train Defenders. We Build Leaders. We Protect Nations.',
  description: 'Elite cyber training platform for Africa\'s next generation of defenders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-och-midnight text-white">{children}</body>
    </html>
  )
}
