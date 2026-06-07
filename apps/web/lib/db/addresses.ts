import 'server-only'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { SavedAddress } from '@zakhtsyanka/shared/types'

interface AddressRow {
  id: string
  customer_id: string
  label: string
  street: string
  city: string
  postal_code: string
  is_default: boolean
  created_at: string
}

function mapAddress(row: AddressRow): SavedAddress {
  return {
    id:         row.id,
    customerId: row.customer_id,
    label:      row.label,
    street:     row.street,
    city:       row.city,
    postalCode: row.postal_code,
    isDefault:  row.is_default,
  }
}

export async function getAddresses(customerId: string): Promise<SavedAddress[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('saved_addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at')
    .returns<AddressRow[]>()

  if (error) throw new Error(`getAddresses: ${error.message}`)
  return (data ?? []).map(mapAddress)
}

export async function createAddress(
  customerId: string,
  input: Omit<SavedAddress, 'id' | 'customerId'>,
): Promise<SavedAddress> {
  const supabase = await createClient()

  // If new address is default, clear existing defaults first
  if (input.isDefault) {
    await supabase
      .from('saved_addresses')
      .update({ is_default: false })
      .eq('customer_id', customerId)
  }

  const { data, error } = await supabase
    .from('saved_addresses')
    .insert({
      customer_id: customerId,
      label:       input.label,
      street:      input.street,
      city:        input.city,
      postal_code: input.postalCode,
      is_default:  input.isDefault,
    })
    .select()
    .single<AddressRow>()

  if (error) throw new Error(`createAddress: ${error.message}`)
  return mapAddress(data)
}

export async function deleteAddress(id: string, customerId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('saved_addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', customerId)  // RLS + extra safety
  if (error) throw new Error(`deleteAddress: ${error.message}`)
}

export async function setDefaultAddress(id: string, customerId: string): Promise<void> {
  const supabase = await createClient()
  // Clear all defaults, then set new one
  await supabase.from('saved_addresses').update({ is_default: false }).eq('customer_id', customerId)
  await supabase.from('saved_addresses').update({ is_default: true }).eq('id', id).eq('customer_id', customerId)
}
