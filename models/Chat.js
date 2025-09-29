const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    time: {
      type: String,
      required: true,
      default: () => new Date().toISOString(),
    },
  },
  { _id: true }
);

const ChatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      default: 'New Chat',
      trim: true,
    },
    messages: {
      type: [MessageSchema],
      default: [],
    },
    archived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

ChatSchema.index({ user: 1, updatedAt: -1 });

const Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;