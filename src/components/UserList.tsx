"use client"
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


type User = {
  _id: string
  name: string
  email: string
  role: string
}

export default function UserList() {
  const [users, setUsers] = useState<User[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const fetchUsers = async () => {
      try {
        const headers: Record<string,string> = { 'Content-Type': 'application/json' }
        try {
          const token = localStorage.getItem('token')
          if (token) headers['authorization'] = `Bearer ${token}`
        } catch (e) {
          // ignore localStorage errors in some environments
        }
        const res = await fetch('/api/users', { headers })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(`Failed to fetch users: ${res.status} ${text}`)
        }
        const data = await res.json()
        if (mounted) setUsers(data)
      } catch (err: any) {
        if (mounted) setError(err.message || 'Unknown error')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchUsers()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return (
    <div className='flex items-center justify-center h-75'>
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    </div>
  )
  if (error) return <div className="text-red-600 flex items-center justify-center h-75">Error: {error}</div>
  if (!users || users.length === 0) return <div>No users found.</div>

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto mt-2">
      {users.map((u) => (
        <div key={u._id} className="p-3 border rounded-md flex items-center justify-between">
          <div>
            <div className="font-semibold flex items-center gap-2">
              {u.name}
              <Badge
                variant="outline"
                className={
                  u.role === 'admin'
                    ? 'border-red-300 text-red-700 bg-red-50 dark:bg-red-950/20'
                    : u.role === 'staff'
                    ? 'border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/20'
                    : 'border-gray-300 text-gray-700 bg-gray-50 dark:bg-gray-950/20'
                }
              >
                {u.role}
              </Badge>
            </div>
            <div className="text-sm text-gray-600">{u.email}</div>
          </div>
          <div className='ml-4 flex items-center gap-2'>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">Edit</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit user</DialogTitle>
                  <DialogDescription>Update user information and role.</DialogDescription>
                </DialogHeader>
                <form
                  id={`edit-form-${u._id}`}
                  onSubmit={async (e) => {
                    e.preventDefault()
                    const form = e.currentTarget as HTMLFormElement
                    const formData = new FormData(form)
                    const payload = {
                      name: String(formData.get('name') || u.name),
                      email: String(formData.get('email') || u.email),
                      role: String(formData.get('role') || u.role),
                    }
                    try {
                      const headers: Record<string,string> = { 'Content-Type': 'application/json' }
                      try {
                        const token = localStorage.getItem('token')
                        if (token) headers['authorization'] = `Bearer ${token}`
                      } catch {}
                      const res = await fetch(`/api/users/${u._id}`, { method: 'PUT', headers, body: JSON.stringify(payload) })
                      if (!res.ok) {
                        const text = await res.text()
                        throw new Error(`Failed to update user: ${res.status} ${text}`)
                      }
                      const updated = await res.json()
                      setUsers((prev) => prev ? prev.map(x => x._id === u._id ? { ...x, ...updated } : x) : prev)
                      toast.success('User updated')
                    } catch (err: any) {
                      toast.error(err?.message || 'Failed to update user')
                    }
                  }}
                  className='space-y-4'
                >
                  <div className='grid gap-2'>
                    <Label htmlFor={`name-${u._id}`}>Name</Label>
                    <Input id={`name-${u._id}`} name='name' defaultValue={u.name} />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor={`email-${u._id}`}>Email</Label>
                    <Input id={`email-${u._id}`} type='email' name='email' defaultValue={u.email} />
                  </div>
                  <div className='grid gap-2'>
                    <Label htmlFor={`role-${u._id}`}>Role</Label>
                    <Input id={`role-${u._id}`} name='role' defaultValue={u.role} />
                  </div>
                  <DialogFooter>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type='button'>Save changes</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Save changes?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will update the user details.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction asChild>
                            <Button type='submit' form={`edit-form-${u._id}`}>Confirm</Button>
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {u.role !== 'admin' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant='destructive' size='sm' >Delete</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {u.name}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          const headers: Record<string,string> = { 'Content-Type': 'application/json' }
                          try {
                            const token = localStorage.getItem('token')
                            if (token) headers['authorization'] = `Bearer ${token}`
                          } catch {}
                          const res = await fetch(`/api/users/${u._id}`, { method: 'DELETE', headers })
                          if (!res.ok) {
                            const text = await res.text()
                            throw new Error(`Failed to delete user: ${res.status} ${text}`)
                          }
                          setUsers((prev) => prev ? prev.filter(user => user._id !== u._id) : prev)
                          toast.success(`User ${u.name} deleted.`)
                        } catch (err: any) {
                          toast.error(err?.message || 'Failed to delete user.')
                        }
                      }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
