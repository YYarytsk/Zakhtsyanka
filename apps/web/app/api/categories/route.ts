import { NextResponse } from 'next/server'
import { getCategories } from '@/lib/db/categories'

export async function GET() {
  try {
    const categories = await getCategories()
    return NextResponse.json(categories)
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
