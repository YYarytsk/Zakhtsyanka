import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteProduct } from '@/lib/db/products'

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('staff').select('role').eq('id', user.id).single()
  return data ?? null
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  if (!await requireStaff()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await props.params
  try {
    await deleteProduct(id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
