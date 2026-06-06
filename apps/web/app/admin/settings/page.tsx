import { getStoreSettings } from '@/lib/db/settings'
import { SettingsForm } from '@/components/admin/SettingsForm'

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings()

  return (
    <div>
      <h1 className="text-xl font-bold text-stone-900 mb-6">Налаштування магазину</h1>
      <SettingsForm
        initialPaused={settings.ordersPaused}
        initialAnnouncementUk={settings.announcementUk ?? ''}
        initialAnnouncementEn={settings.announcementEn ?? ''}
        initialLeadPickup={settings.leadTimePickupHours}
        initialLeadDelivery={settings.leadTimeDeliveryHours}
      />
    </div>
  )
}
