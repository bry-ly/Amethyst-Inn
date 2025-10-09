import React from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Amethyst Inn - Room Details",
}

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

async function getRoom(roomid: string) {
  const hdrs = await headers()
  const host = hdrs.get('x-forwarded-host') || hdrs.get('host') || 'localhost:3000'
  const proto = hdrs.get('x-forwarded-proto') || 'http'
  const siteBase = (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim().length > 0)
    ? process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
    : `${proto}://${host}`

  const apiUrl = `${siteBase}/api/rooms/${roomid}`
  const res = await fetch(apiUrl, { cache: 'no-store', credentials: 'same-origin' }).catch(() => null)
  if (!res || !res.ok) {
    // Fallback to direct backend if internal API is not reachable
  const backend = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
  const res2 = await fetch(`${backend}/api/rooms/${roomid}`, { cache: 'no-store' })
    if (!res2.ok) throw new Error('Failed to fetch room')
    return res2.json()
  }
  return res.json()
}

export default async function Page({ params }: { params: { roomid: string } }) {
  const { roomid } = params
  const room = await getRoom(roomid)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Room {room?.number || roomid}</h1>
          <div className="mt-1 flex items-center gap-2">
            {room?.status && (
              <Badge variant="outline" className={
                room.status === 'available'
                  ? 'border-green-300 text-green-700 bg-green-50 dark:bg-green-950/20'
                  : room.status === 'occupied'
                  ? 'border-yellow-300 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20'
                  : 'border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20'
              }>{room.status}</Badge>
            )}
            {typeof room?.pricePerNight === 'number' && (
              <span className="text-sm text-muted-foreground">₱{room.pricePerNight.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / night</span>
            )}
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={`/rooms/${roomid}/edit`}>Edit</Link>
        </Button>
      </div>

      <div className="grid gap-6 mt-6 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Type</div>
            <div className="text-sm text-muted-foreground capitalize">{room?.type || '-'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Guest Capacity</div>
            <div className="text-sm text-muted-foreground">
              {typeof room?.guestCapacity === 'number' && room.guestCapacity > 0
                ? room.guestCapacity
                : ((room?.capacity?.adults ?? 0) + (room?.capacity?.children ?? 0))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Floor</div>
            <div className="text-sm text-muted-foreground">{room?.floor ?? '-'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Size</div>
            <div className="text-sm text-muted-foreground">{room?.size ? `${room.size} sqm` : '-'}</div>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <div className="text-sm font-medium">Amenities</div>
            <div className="text-sm text-muted-foreground">{Array.isArray(room?.amenities) && room.amenities.length ? room.amenities.join(', ') : '-'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Description</div>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">{room?.description || '-'}</div>
          </div>
          <div>
            <div className="text-sm font-medium">Updated</div>
            <div className="text-sm text-muted-foreground">{room?.updatedAt ? new Date(room.updatedAt).toLocaleString() : '-'}</div>
          </div>
        </div>
      </div>
    </div>
  )
}


