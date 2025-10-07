"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { toast } from "sonner";
import { AuthTokenManager } from "@/utils/cookies";
import { 
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Ban,
  TrendingUp,
  DollarSign,
  CalendarDays,
} from "lucide-react";

type UserProfile = {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
  phone?: string;
  address?: string;
  bio?: string;
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  bio: string;
};

function UserProfileEditForm({
  formState,
  onChange,
  onSave,
  loading,
  onCancel,
}: {
  formState: FormState;
  onChange: (f: Partial<FormState>) => void;
  onSave: (e?: React.FormEvent) => void;
  loading: boolean;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSave} className="space-y-4">
      <div>
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={formState.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formState.email}
          onChange={(e) => onChange({ email: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formState.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formState.address}
          onChange={(e) => onChange({ address: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formState.bio}
          onChange={(e) => onChange({ bio: e.target.value })}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}

type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "checked_in"
  | "checked_out"
  | "no_show";

type BookingGuestInfo = {
  adults?: number;
  children?: number;
};

type BookingRoomInfo = {
  number?: string;
  title?: string;
  name?: string;
  type?: string;
};

type BookingRecord = {
  _id: string;
  status?: BookingStatus;
  checkInDate?: string;
  checkOutDate?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
  checkIn?: string;
  checkOut?: string;
  room?: BookingRoomInfo;
  guestCount?: number;
  guests?: BookingGuestInfo;
  totalPrice?: number;
  price?: number;
  specialRequests?: string;
};

type BookingActionLoading = Record<string, boolean>;

type CancellationResponse = {
  error?: string;
  message?: string;
  data?: {
    refundEligible?: boolean;
    refundAmount?: number;
  };
};

type BookingsApiResponse = {
  data?: BookingRecord[];
  bookings?: BookingRecord[];
  [key: string]: unknown;
};

type StatusIconComponent = React.ComponentType<{ className?: string }>;

function getStatusConfig(status: string) {
  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: StatusIconComponent }> = {
    pending: { label: "Pending", variant: "secondary", icon: Clock },
    confirmed: { label: "Confirmed", variant: "default", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", variant: "destructive", icon: XCircle },
    completed: { label: "Completed", variant: "outline", icon: CheckCircle2 },
    checked_in: { label: "Checked In", variant: "default", icon: CheckCircle2 },
    checked_out: { label: "Checked Out", variant: "outline", icon: CheckCircle2 },
    no_show: { label: "No Show", variant: "destructive", icon: Ban },
  };
  return statusMap[status] || { label: status, variant: "secondary" as const, icon: Clock };
}

function BookingCard({
  booking,
  onCancel,
  onDelete,
  actionLoading,
}: {
  booking: BookingRecord;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  actionLoading: BookingActionLoading;
}) {
  const status = getStatusConfig(booking.status || "pending");
  const StatusIcon = status.icon;
  
  const checkInDate = new Date(booking.checkInDate || booking.startDate || booking.from || booking.checkIn || new Date().toISOString());
  const checkOutDate = new Date(booking.checkOutDate || booking.endDate || booking.to || booking.checkOut || new Date().toISOString());
  
  // Calculate hours until check-in for 24-hour cancellation policy
  const now = new Date();
  const hoursUntilCheckIn = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancel = hoursUntilCheckIn >= 24 && 
    booking.status !== "cancelled" && 
    booking.status !== "completed" && 
    booking.status !== "checked_out";
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              {booking.room?.number ? `Room ${booking.room.number}` : booking.room?.title || booking.room?.name || "Room Booking"}
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              {booking.room?.type && (
                <span className="capitalize">{booking.room.type} Room</span>
              )}
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Check-in</span>
            </div>
            <div className="ml-6">{checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Check-out</span>
            </div>
            <div className="ml-6">{checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-lg">₱{booking.totalPrice ?? booking.price ?? "0"}</span>
          </div>
          <div className="flex items-center gap-2">
            {(booking.guestCount || booking.guests) && (
              <span className="text-muted-foreground">
                {booking.guestCount 
                  ? `${booking.guestCount} ${booking.guestCount === 1 ? "Guest" : "Guests"}`
                  : `${booking.guests?.adults || 0} ${booking.guests?.adults === 1 ? "Adult" : "Adults"}${(booking.guests?.children || 0) > 0 ? `, ${booking.guests?.children} ${booking.guests?.children === 1 ? "Child" : "Children"}` : ""}`
                }
              </span>
            )}
          </div>
        </div>
        
        {booking.specialRequests && (
          <div className="text-sm">
            <div className="font-medium text-muted-foreground mb-1">Special Requests</div>
            <div className="text-xs bg-muted/50 p-2 rounded border">{booking.specialRequests}</div>
          </div>
        )}
        
        {!canCancel && hoursUntilCheckIn < 24 && hoursUntilCheckIn > 0 && booking.status !== "cancelled" && (
          <div className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-2 rounded border border-amber-200 dark:border-amber-800">
            ⚠️ Cancellation not available - less than 24 hours until check-in
          </div>
        )}
        
        <div className="flex items-center gap-2 pt-2">
          {canCancel && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onCancel(booking._id)}
              disabled={!!actionLoading[booking._id]}
              className="flex-1"
            >
              {actionLoading[booking._id] ? (
                "Cancelling..."
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-1" />
                  Cancel
                </>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(booking._id)}
            disabled={!!actionLoading[booking._id]}
            className={booking.status !== "cancelled" && booking.status !== "completed" && booking.status !== "checked_out" ? "" : "flex-1"}
          >
            {actionLoading[booking._id] ? (
              "Hiding..."
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-1" />
                Hide
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingsList({
  bookings,
  loading,
  onCancel,
  onDelete,
  actionLoading,
}: {
  bookings: BookingRecord[];
  loading: boolean;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  actionLoading: BookingActionLoading;
}) {
  if (loading)
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center text-muted-foreground">
            <Clock className="h-5 w-5 mr-2 animate-spin" />
            Loading bookings...
          </div>
        </CardContent>
      </Card>
    );
  if (!bookings || bookings.length === 0)
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
            <p className="text-muted-foreground font-medium">No bookings found</p>
            <p className="text-sm text-muted-foreground">Your booking history will appear here</p>
          </div>
        </CardContent>
      </Card>
    );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bookings.map((b) => (
        <BookingCard
          key={b._id}
          booking={b}
          onCancel={onCancel}
          onDelete={onDelete}
          actionLoading={actionLoading}
        />
      ))}
    </div>
  );
}

function BookingStats({ bookings }: { bookings: BookingRecord[] }) {
  const stats = useMemo(() => {
    return {
      total: bookings.length,
      pending: bookings.filter(b => b.status === "pending").length,
      confirmed: bookings.filter(b => b.status === "confirmed" || b.status === "checked_in").length,
      completed: bookings.filter(b => b.status === "completed" || b.status === "checked_out").length,
      cancelled: bookings.filter(b => b.status === "cancelled").length,
      totalSpent: bookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0),
    };
  }, [bookings]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Bookings
          </CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active/Confirmed
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Completed
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Spent
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₱{stats.totalSpent.toLocaleString()}</div>
        </CardContent>
      </Card>
    </div>
  );
}

export function UserProfileDashboard({
  user: initialUser,
  onUpdated,
}: {
  user?: UserProfile | null;
  onUpdated?: (user: UserProfile) => void;
}) {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [formState, setFormState] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    address: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [actionLoading, setActionLoading] = useState<BookingActionLoading>({});

  // Effect: profile and bookings
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    } else {
      (async () => {
        setLoading(true);
        try {
          const token = AuthTokenManager.getToken();
          const res = await fetch("/api/auth/me", {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            cache: "no-store",
          });
          if (res.ok) {
            setUser(await res.json());
          }
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [initialUser]);

  useEffect(() => {
    setFormState({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      bio: user?.bio || "",
    });
  }, [user]);

  const loadBookings = useCallback(async () => {
    if (!user) {
      console.log("No user, skipping booking load");
      return;
    }
    setLoadingBookings(true);
    try {
      const token = AuthTokenManager.getToken();
      console.log("Loading bookings for user:", user.email, "Token exists:", !!token);
      
      const res = await fetch(`/api/bookings`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: "no-store",
      });
      
      console.log("Bookings fetch response status:", res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Failed to load bookings:", errorText);
        throw new Error(`Failed to load bookings: ${res.status}`);
      }
      
      const response = (await res.json()) as BookingsApiResponse | BookingRecord[];
      console.log("Bookings API response:", response);
      
      // Backend returns { success: true, data: [...] } format
      const bookingsData = Array.isArray(response)
        ? response
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.bookings)
            ? response.bookings
            : [];
      
      console.log("Processed bookings data:", bookingsData);
      
      // Backend already filters by user, but double-check for client-side
      setBookings(bookingsData);
      
      console.log("Set bookings count:", Array.isArray(bookingsData) ? bookingsData.length : 0);
    } catch (error: unknown) {
      console.error("Error loading bookings:", error);
      toast.error("Could not load bookings");
    } finally {
      setLoadingBookings(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) loadBookings();
  }, [user, loadBookings]);

  const setAction = (id: string, value: boolean) =>
    setActionLoading((s) => ({ ...s, [id]: value }));

  const handleCancelBooking = useCallback(
    async (id: string) => {
      setAction(id, true);
      try {
        const token = AuthTokenManager.getToken();
        const res = await fetch(`/api/bookings/${id}/cancel`, {
          method: "PUT",
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            cancellationReason: "Cancelled by user"
          })
        });
        
        const data = (await res.json()) as CancellationResponse;
        
        if (!res.ok) {
          throw new Error(data.error || data.message || "Failed to cancel booking");
        }
        
        toast.success("Booking cancelled successfully", {
          description: data.data?.refundEligible 
            ? `Refund amount: ₱${(data.data.refundAmount ?? 0).toLocaleString()}` 
            : "No refund available",
          duration: 5000,
        });
        await loadBookings();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to cancel booking";
        toast.error("Cancellation Failed", {
          description: message,
          duration: 5000,
        });
      } finally {
        setAction(id, false);
      }
    },
    [loadBookings]
  );

  const handleDeleteBooking = useCallback(
    async (id: string) => {
      if (!confirm("Hide this booking from your view? This won't delete it from the system."))
        return;
      setAction(id, true);
      try {
        // Only hide booking on client side, don't delete from database
        setBookings((prev) => prev.filter((b) => b._id !== id));
        toast.success("Booking hidden from view");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to hide booking";
        toast.error(message);
      } finally {
        setAction(id, false);
      }
    },
    []
  );

  const handleFormChange = (changes: Partial<FormState>) =>
    setFormState((prev) => ({ ...prev, ...changes }));

  const handleSave = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    try {
      if (!formState.name.trim() || !formState.email.trim()) {
        toast.error("Name and email are required");
        return;
      }
      const payload = {
        name: formState.name.trim(),
        email: formState.email.trim(),
        phone: formState.phone.trim() || undefined,
        address: formState.address.trim() || undefined,
        bio: formState.bio.trim() || undefined,
      };
      const token = AuthTokenManager.getToken();
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to update profile");
      }
      const updated = await res.json();
      setUser(updated || { ...payload });
      toast.success("Profile updated");
      onUpdated?.(updated || { ...payload });
      setIsEditOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state during initial profile load
  if (loading && !user) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-3">
              <Clock className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading your profile...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="flex-1 space-y-4 w-full">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    {user?.name || "Unnamed User"}
                    <Badge variant="secondary" className="text-xs">
                      {user?.role || "guest"}
                    </Badge>
                  </h2>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email || "No email"}</span>
                  </div>
                </div>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Edit profile</DialogTitle>
                      <DialogDescription>
                        Update your account details below.
                      </DialogDescription>
                    </DialogHeader>
                    <UserProfileEditForm
                      formState={formState}
                      onChange={handleFormChange}
                      onSave={handleSave}
                      loading={loading}
                      onCancel={() => setIsEditOpen(false)}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {user?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="font-medium text-sm">{user.phone}</div>
                    </div>
                  </div>
                )}
                {user?.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Address</div>
                      <div className="font-medium text-sm">{user.address}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {user?.bio && (
                <>
                  <Separator />
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">About</div>
                    <p className="text-sm">{user.bio}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Booking Statistics */}
      {bookings.length > 0 && !loadingBookings && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Booking Statistics</h3>
          <BookingStats bookings={bookings} />
        </div>
      )}

      {/* Bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Your Bookings</h3>
          <Button variant="outline" size="sm" onClick={loadBookings} disabled={loadingBookings}>
            <CalendarDays className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <BookingsList
          bookings={bookings}
          loading={loadingBookings}
          onCancel={handleCancelBooking}
          onDelete={handleDeleteBooking}
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}

export default UserProfileDashboard;
