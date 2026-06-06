// The proxy.ts redirects `/` → `/uk/` before this renders.
// This page is a safety net for any edge case that slips through.
import { redirect } from 'next/navigation'

export default function RootPage() {
  redirect('/uk')
}
