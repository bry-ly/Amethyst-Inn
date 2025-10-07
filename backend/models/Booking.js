import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
      index: true
    },
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guest is required"],
      index: true
    },
    checkInDate: { 
      type: Date, 
      required: [true, "Check-in date is required"],
      validate: {
        validator: function(v) {
          return v > new Date();
        },
        message: "Check-in date must be in the future"
      }
    },
    checkOutDate: { 
      type: Date, 
      required: [true, "Check-out date is required"],
      validate: {
        validator: function(v) {
          return v > this.checkInDate;
        },
        message: "Check-out date must be after check-in date"
      }
    },
    guests: {
      adults: {
        type: Number,
        required: [true, "Number of adults is required"],
        min: [1, "At least 1 adult is required"],
        max: [10, "Cannot exceed 10 adults"]
      },
      children: {
        type: Number,
        default: 0,
        min: [0, "Children count cannot be negative"],
        max: [5, "Cannot exceed 5 children"]
      }
    },
    totalPrice: { 
      type: Number, 
      required: [true, "Total price is required"],
      min: [0, "Price cannot be negative"]
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "completed", "no_show", "checked_in", "checked_out"],
        message: "Status must be one of: pending, confirmed, cancelled, completed, no_show, checked_in, checked_out"
      },
      default: "pending",
      index: true
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
      trim: true
    },
    cancellationReason: {
      type: String,
      maxlength: [200, "Cancellation reason cannot exceed 200 characters"],
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Payment fields
    isPaid: { 
      type: Boolean, 
      default: false
    },
    paidAt: { 
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v <= new Date();
        },
        message: "Payment date cannot be in the future"
      }
    },
    paymentMethod: { 
      type: String,
      enum: {
        values: ["cash", "card", "stripe", "paypal", "bank_transfer"],
        message: "Payment method must be one of: cash, card, stripe, paypal, bank_transfer"
      }
    },
    paymentReference: {
      type: String,
      trim: true
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      amount: { type: Number },
      currency: { type: String, default: "USD" }
    },
    
    // Check-in/out tracking
    checkedInAt: {
      type: Date
    },
    checkedOutAt: {
      type: Date
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    
    // Review and feedback
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"]
    },
    review: {
      type: String,
      maxlength: [1000, "Review cannot exceed 1000 characters"],
      trim: true
    },
    reviewDate: {
      type: Date
    },
    
    // Internal notes
    internalNotes: [{
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
bookingSchema.index({ guest: 1, status: 1 });
bookingSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ status: 1, checkInDate: 1 });
bookingSchema.index({ isPaid: 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for total guests
bookingSchema.virtual('totalGuests').get(function() {
  return this.guests.adults + this.guests.children;
});

// Virtual for number of nights
bookingSchema.virtual('numberOfNights').get(function() {
  if (!this.checkInDate || !this.checkOutDate) return 0;
  const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function() {
  if (!this.checkInDate || !this.checkOutDate) return 0;
  const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual to check if booking is active
bookingSchema.virtual('isActive').get(function() {
  const now = new Date();
  return this.status === 'confirmed' && 
         this.checkInDate <= now && 
         this.checkOutDate > now;
});

// Virtual to check if booking can be cancelled
bookingSchema.virtual('canBeCancelled').get(function() {
  const now = new Date();
  const hoursUntilCheckIn = (this.checkInDate - now) / (1000 * 60 * 60);
  return this.status === 'confirmed' && hoursUntilCheckIn > 24;
});

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Set cancellation date if status is cancelled
  if (this.isModified('status') && this.status === 'cancelled' && !this.cancelledAt) {
    this.cancelledAt = new Date();
  }
  
  next();
});

// Static method to find overlapping bookings
bookingSchema.statics.findOverlapping = function(roomId, checkInDate, checkOutDate, excludeId = null) {
  const query = {
    room: roomId,
    status: { $in: ['confirmed', 'checked_in'] },
    $or: [
      {
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Static method to get booking statistics
bookingSchema.statics.getStats = function(filters = {}) {
  return this.aggregate([
    { $match: filters },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$totalPrice' },
        averageBookingValue: { $avg: '$totalPrice' },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Instance method to calculate refund amount
bookingSchema.methods.calculateRefund = function() {
  if (this.status !== 'cancelled') return 0;
  
  const now = new Date();
  const hoursUntilCheckIn = (this.checkInDate - now) / (1000 * 60 * 60);
  
  // Full refund if cancelled more than 24 hours before check-in
  if (hoursUntilCheckIn > 24) {
    return this.totalPrice;
  }
  
  // 50% refund if cancelled within 24 hours
  if (hoursUntilCheckIn > 0) {
    return this.totalPrice * 0.5;
  }
  
  // No refund for same-day cancellations
  return 0;
};

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
