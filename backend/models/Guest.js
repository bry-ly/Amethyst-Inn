import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // link to User
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    preferences: {
      type: String, // e.g. "Non-smoking, sea view"
    },
  },
  { timestamps: true }
);

const Guest = mongoose.model("Guest", guestSchema);
export default Guest;
