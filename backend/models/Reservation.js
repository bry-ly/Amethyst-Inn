import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Guest is required"],
      index: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: [true, "Room is required"],
      index: true
    },
    checkInDate: { 
      type: Date, 
      required: [true, "Check-in date is required"],
      index: true
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
    guestCount: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: [1, "At least 1 guest is required"],
      max: [20, "Cannot exceed 20 guests"]
    },
    totalPrice: { 
      type: Number, 
      required: [true, "Total price is required"],
      min: [0, "Price cannot be negative"]
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "cancelled", "expired", "converted_to_booking"],
        message: "Status must be one of: pending, confirmed, cancelled, expired, converted_to_booking"
      },
      default: "pending",
      index: true
    },
    specialRequests: {
      type: String,
      maxlength: [500, "Special requests cannot exceed 500 characters"],
      trim: true
    },
    identificationDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: [true, "Identification document is required for verification"],
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
    confirmedAt: {
      type: Date
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },
    convertedToBooking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },
    depositAmount: {
      type: Number,
      default: 0,
      min: [0, "Deposit cannot be negative"]
    },
    depositPaid: {
      type: Boolean,
      default: false
    },
    depositPaidAt: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "stripe", "paypal", "bank_transfer"],
    },
    paymentReference: {
      type: String,
      trim: true
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
reservationSchema.index({ guest: 1, status: 1 });
reservationSchema.index({ room: 1, checkInDate: 1, checkOutDate: 1 });
reservationSchema.index({ status: 1, expiresAt: 1 });
reservationSchema.index({ createdAt: -1 });

// Virtual for total guests (compatibility)
reservationSchema.virtual('totalGuests').get(function() {
  return this.guestCount;
});

// Virtual for number of nights
reservationSchema.virtual('numberOfNights').get(function() {
  if (!this.checkInDate || !this.checkOutDate) return 0;
  const diffTime = Math.abs(this.checkOutDate - this.checkInDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for duration in days
reservationSchema.virtual('duration').get(function() {
  return this.numberOfNights;
});

// Virtual to check if reservation is expired
reservationSchema.virtual('isExpired').get(function() {
  return new Date() > this.expiresAt && this.status === 'pending';
});

// Static method to find overlapping reservations
reservationSchema.statics.findOverlapping = function(roomId, checkInDate, checkOutDate, excludeId = null) {
  const query = {
    room: roomId,
    status: { $in: ['pending', 'confirmed'] },
    $or: [
      {
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

// Method to calculate deposit (typically 20% of total)
reservationSchema.methods.calculateDeposit = function() {
  return Math.round(this.totalPrice * 0.2);
};

// Pre-save middleware to set expiration date (48 hours from creation)
reservationSchema.pre('save', function(next) {
  if (this.isNew && !this.expiresAt) {
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 48); // 48 hours to confirm
    this.expiresAt = expirationDate;
  }
  next();
});

// Pre-save middleware to update confirmedAt
reservationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
