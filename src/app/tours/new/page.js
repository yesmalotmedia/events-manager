import TourForm from '@/components/ui/TourForm'
import Link from 'next/link'

export default function NewTourPage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/tours" className="text-stone-400 hover:text-stone-600 text-sm">← חזרה</Link>
        <div>
          <h1 className="text-2xl font-bold text-stone-800">סיור חדש</h1>
        </div>
      </div>
      <TourForm />
    </div>
  )
}
