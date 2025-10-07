"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { IconPlus } from "@tabler/icons-react";

interface RoomFormData {
  number: string;
  type: string;
  pricePerNight: number;
  description: string;
  amenities: string[];
  capacity: {
    adults: number;
    children: number;
  };
  size?: number;
  floor?: number;
  features: {
    hasBalcony: boolean;
    hasSeaView: boolean;
    hasKitchen: boolean;
    hasJacuzzi: boolean;
    isAccessible: boolean;
  };
  images: string[];
}

const roomTypes = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "suite", label: "Suite" },
  { value: "deluxe", label: "Deluxe" },
  { value: "family", label: "Family" },
  { value: "presidential", label: "Presidential" },
  { value: "standard", label: "Standard" },
  { value: "premium", label: "Premium" },
];

const commonAmenities = [
  "WiFi",
  "Air Conditioning",
  "TV",
  "Mini Bar",
  "Room Service",
  "Safe",
  "Balcony",
  "Sea View",
  "Kitchen",
  "Jacuzzi",
  "Accessible",
  "Parking",
  "Gym Access",
  "Pool Access",
  "Spa Access",
];

export function AddRoomDialog({ onRoomAdded }: { onRoomAdded?: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RoomFormData>({
    number: "",
    type: "",
    pricePerNight: 0,
    description: "",
    amenities: [],
    capacity: {
      adults: 1,
      children: 0,
    },
    size: undefined,
    floor: undefined,
    features: {
      hasBalcony: false,
      hasSeaView: false,
      hasKitchen: false,
      hasJacuzzi: false,
      isAccessible: false,
    },
    images: [],
  });

  const [newAmenity, setNewAmenity] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof RoomFormData] as any),
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const addCustomAmenity = () => {
    if (newAmenity.trim() && !formData.amenities.includes(newAmenity.trim())) {
      setFormData((prev) => ({
        ...prev,
        amenities: [...prev.amenities, newAmenity.trim()],
      }));
      setNewAmenity("");
    }
  };

  const addImageUrl = () => {
    if (newImageUrl.trim() && !formData.images.includes(newImageUrl.trim())) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()],
      }));
      setNewImageUrl("");
    }
  };

  const removeImageUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get authentication token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch("/api/rooms", {
        method: "POST",
        headers,
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        toast.success("Room created successfully!", {
          description: `Room ${formData.number} has been added to the system.`,
        });
        setOpen(false);
        setFormData({
          number: "",
          type: "",
          pricePerNight: 0,
          description: "",
          amenities: [],
          capacity: { adults: 1, children: 0 },
          size: undefined,
          floor: undefined,
          features: {
            hasBalcony: false,
            hasSeaView: false,
            hasKitchen: false,
            hasJacuzzi: false,
            isAccessible: false,
          },
          images: [],
        });
        onRoomAdded?.();
      } else {
        throw new Error(data.error || data.message || "Failed to create room");
      }
    } catch (error: any) {
      console.error("Room creation error:", error);
      toast.error("Failed to create room", {
        description: error.message || "Please try again or contact support.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <IconPlus className="h-4 w-4 mr-2" />
          Create Room
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Room</DialogTitle>
          <DialogDescription>
            Create a new room for the Amethyst Inn. Fill in all required information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="number">Room Number *</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleInputChange("number", e.target.value.toUpperCase())}
                placeholder="e.g., A101, B205"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Room Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pricePerNight">Price per Night (₱) *</Label>
              <Input
                id="pricePerNight"
                type="number"
                min="0"
                step="0.01"
                value={formData.pricePerNight}
                onChange={(e) => handleInputChange("pricePerNight", parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Size (sqm)</Label>
              <Input
                id="size"
                type="number"
                min="10"
                max="500"
                value={formData.size || ""}
                onChange={(e) => handleInputChange("size", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                type="number"
                min="0"
                max="50"
                value={formData.floor || ""}
                onChange={(e) => handleInputChange("floor", e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Optional"
              />
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-2">
            <Label>Capacity *</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults">Adults</Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.capacity.adults}
                  onChange={(e) => handleInputChange("capacity.adults", parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="children">Children</Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.capacity.children}
                  onChange={(e) => handleInputChange("capacity.children", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the room features and amenities..."
              maxLength={1000}
            />
          </div>

          {/* Features */}
          <div className="space-y-2">
            <Label>Special Features</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(formData.features).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={key}
                    checked={value}
                    onCheckedChange={(checked) => handleInputChange(`features.${key}`, checked)}
                  />
                  <Label htmlFor={key} className="text-sm font-normal">
                    {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {commonAmenities.map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity}
                    checked={formData.amenities.includes(amenity)}
                    onCheckedChange={() => handleAmenityToggle(amenity)}
                  />
                  <Label htmlFor={amenity} className="text-sm font-normal">
                    {amenity}
                  </Label>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                placeholder="Add custom amenity"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
              />
              <Button type="button" variant="outline" onClick={addCustomAmenity}>
                Add
              </Button>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Room Images</Label>
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Image URL"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
              />
              <Button type="button" variant="outline" onClick={addImageUrl}>
                Add
              </Button>
            </div>
            {formData.images.length > 0 && (
              <div className="space-y-2">
                {formData.images.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground truncate flex-1">
                      {url}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeImageUrl(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
