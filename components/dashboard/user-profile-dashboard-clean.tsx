"use client";

import React, { useEffect, useState } from "react";
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
import { Spinner } from "../ui/spinner";
import { toast } from "sonner";
import { AuthTokenManager } from "@/utils/cookies";
import { 
  MapPin,
  Phone,
  Mail,
  User,
  TrendingUp,
  CalendarDays,
  Star,
  Clock,
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

  // Load user profile
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
            credentials: 'same-origin',
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

  // Sync form state with user data
  useEffect(() => {
    setFormState({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      bio: user?.bio || "",
    });
  }, [user]);

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
        <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground h-100">
            <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
              <Spinner className="size-8 text-primary" />
              <p>Loading your profile...</p>
            </div>
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Navigate to different sections of your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" asChild>
              <a href="/profile/bookings">
                <CalendarDays className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">My Bookings</div>
                  <div className="text-xs text-muted-foreground">View and manage your bookings</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" asChild>
              <a href="/profile/statistics">
                <TrendingUp className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">Statistics</div>
                  <div className="text-xs text-muted-foreground">View your booking statistics</div>
                </div>
              </a>
            </Button>
            
            <Button variant="outline" className="h-auto py-4 flex flex-col items-start" asChild>
              <a href="/profile/feedback">
                <Star className="h-5 w-5 mb-2" />
                <div className="text-left">
                  <div className="font-semibold">My Feedback</div>
                  <div className="text-xs text-muted-foreground">Submit and view feedback</div>
                </div>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserProfileDashboard;
