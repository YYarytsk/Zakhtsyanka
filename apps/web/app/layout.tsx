// Root layout — minimal shell. All content and <html> attrs are set in app/[lang]/layout.tsx.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
