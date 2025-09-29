const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function () {
      return !this.provider; // required only for normal signup
    },
    unique: false, // usernames from google may clash; handle differently if needed
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [ /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email' ],
  },
  password: {
    type: String,
    minlength: 6,
    select: false, // hide password by default
  },
  provider: {
    type: String, // e.g., "google", "local"
    default: "local",
  },
  pro: {
    type: Number,
    enum: [0, 1],
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Only hash password if provider === "local"
const bcrypt = require('bcryptjs');

UserSchema.pre('save', async function (next) {
  if (this.provider !== "local") return next();

  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password (only for local users)
UserSchema.methods.matchPassword = async function (enteredPassword) {
  if (this.provider !== "local") return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);
module.exports = User;
