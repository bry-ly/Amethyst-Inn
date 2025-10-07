import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    number: {
      type: String,
      required: [true, "Room number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function(v) {
          return /^[A-Z0-9-]+$/.test(v);
        },
        message: "Room number must contain only letters, numbers, and hyphens"
      }
    },
    images: [{
      type: String,
      validate: {
        validator: function(v) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v) || /^https?:\/\/images\.unsplash\.com\/.+/i.test(v);
        },
        message: "Image URL must be a valid image link"
      }
    }],
    type: {
      type: String,
      enum: {
        values: ["single", "double", "suite", "deluxe", "family", "presidential", "standard", "premium"],
        message: "Room type must be one of: single, double, suite, deluxe, family, presidential, standard, premium"
      },
      required: [true, "Room type is required"]
    },
    pricePerNight: {
      type: Number,
      required: [true, "Price per night is required"],
      min: [0, "Price cannot be negative"],
      max: [10000, "Price seems too high"]
    },
    status: {
      type: String,
      enum: {
        values: ["available", "occupied", "maintenance", "cleaning", "out_of_order"],
        message: "Status must be one of: available, occupied, maintenance, cleaning, out_of_order"
      },
      default: "available"
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      trim: true
    },
    amenities: [{
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return v.length > 0 && v.length <= 50;
        },
        message: "Each amenity must be between 1 and 50 characters"
      }
    }],
    capacity: {
      adults: {
        type: Number,
        required: [true, "Adult capacity is required"],
        min: [1, "Room must accommodate at least 1 adult"],
        max: [10, "Room capacity cannot exceed 10 adults"]
      },
      children: {
        type: Number,
        default: 0,
        min: [0, "Children capacity cannot be negative"],
        max: [5, "Room cannot accommodate more than 5 children"]
      }
    },
    size: {
      type: Number,
      min: [10, "Room size must be at least 10 sqm"],
      max: [500, "Room size cannot exceed 500 sqm"]
    },
    floor: {
      type: Number,
      min: [0, "Floor cannot be negative"],
      max: [50, "Floor cannot exceed 50"]
    },
    features: {
      hasBalcony: { type: Boolean, default: false },
      hasSeaView: { type: Boolean, default: false },
      hasKitchen: { type: Boolean, default: false },
      hasJacuzzi: { type: Boolean, default: false },
      isAccessible: { type: Boolean, default: false }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastCleaned: {
      type: Date,
      default: Date.now
    },
    maintenanceNotes: [{
      note: String,
      date: { type: Date, default: Date.now },
      staff: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
// Note: number field already has unique: true which creates an index
roomSchema.index({ type: 1, status: 1 });
roomSchema.index({ pricePerNight: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ isActive: 1 });

// Virtual for total capacity
roomSchema.virtual('totalCapacity').get(function() {
  return this.capacity.adults + this.capacity.children;
});

// Virtual for room availability
roomSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.isActive;
});

// Pre-save middleware to validate business rules
roomSchema.pre('save', function(next) {
  // Ensure room number is uppercase
  if (this.number) {
    this.number = this.number.toUpperCase();
  }
  
  // Validate that children capacity doesn't exceed adults
  if (this.capacity.children > this.capacity.adults) {
    next(new Error('Children capacity cannot exceed adult capacity'));
  }
  
  next();
});

// Static method to find available rooms
roomSchema.statics.findAvailable = function(filters = {}) {
  return this.find({
    status: 'available',
    isActive: true,
    ...filters
  });
};

// Instance method to check if room can be booked
roomSchema.methods.canBeBooked = function() {
  return this.status === 'available' && this.isActive;
};

const Room = mongoose.model("Room", roomSchema);
export default Room;
