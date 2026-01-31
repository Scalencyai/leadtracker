import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LeadTracker - Free B2B Visitor Identification',
  description: 'Identify companies visiting your website with real-time tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  )
}
