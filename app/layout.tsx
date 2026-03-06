import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RECOMP — AI Fitness Tracker',
  description: 'Track food and workouts with natural language AI',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
