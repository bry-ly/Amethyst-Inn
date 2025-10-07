import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Page({ params }: { params: { roomid: string } }) {
  const { roomid } = params
  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Room Details</h1>
        <Button asChild size="sm">
          <Link href={`/rooms/${roomid}/edit`}>Edit</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mt-1">ID: {roomid}</p>
      <div className="mt-4 text-sm">This is a placeholder for the room detail page.</div>
    </div>
  )
}


