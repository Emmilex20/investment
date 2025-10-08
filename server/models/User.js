// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    piCoinsBalance: {
      type: Number,
      required: true,
      default: 0.0, // This is the coin balance for investment
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    // Referral Structure
    referralCode: {
        type: String,
        unique: true,
        // Generated automatically on creation
    },
    referredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Null if not referred by anyone
    },
    referrals: [ // List of users they have referred
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
  }
);

// Middleware to hash the password before saving (pre-save hook)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;