'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import TourForm from '@/components/ui/TourForm'
import Link from 'next/link'

export default function EditTourPage() {
  const { id } = useParams()
  const [tour, setTour] = useState(null)

  useEffect(() => {
    fetch(`/api/tours/${id}`).then(r => r.json()).then(setTour)
  }, [id])

  if (!tour) return <div className="text-stone-400 text-sm p-8">טוען...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href={`/tours/${id}`} className="text-stone-400 hover:text-stone-600 text-sm">← חזרה</Link>
        <h1 className="text-2xl font-bold text-stone-800">עריכת סיור</h1>
      </div>
      <TourForm initial={tour} isEdit={true} />
    </div>
  )
}
