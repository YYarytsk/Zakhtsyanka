import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { deleteAddress } from '@/lib/db/addresses'

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> },
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await props.params
  await deleteAddress(id, user.id)
  return new NextResponse(null, { status: 204 })
}
