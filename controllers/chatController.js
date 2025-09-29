const Chat = require('../models/Chat');

const MAX_TITLE_LENGTH = 80;
const MAX_TITLE_WORDS = 6;

const sanitizeTitle = (rawTitle) => {
  if (typeof rawTitle !== 'string') return '';
  const trimmed = rawTitle.trim().slice(0, MAX_TITLE_LENGTH);
  return trimmed;
};

const deriveTitleFromMessages = (messages = []) => {
  const firstUserMessage = messages.find((msg) => msg.role === 'user' && msg.text);
  if (!firstUserMessage) return '';
  const cleaned = firstUserMessage.text.replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ').slice(0, MAX_TITLE_WORDS).join(' ');
  return sanitizeTitle(words);
};

const sanitizeMessages = (messages = []) => {
  if (!Array.isArray(messages)) return [];
  return messages
    .map((msg) => {
      if (!msg || typeof msg.text !== 'string' || typeof msg.role !== 'string') {
        return null;
      }
      const trimmedText = msg.text.trim();
      if (!trimmedText) return null;
      const role = msg.role === 'assistant' ? 'assistant' : 'user';
      const time =
        typeof msg.time === 'string' && msg.time.trim().length > 0
          ? msg.time.trim()
          : new Date().toISOString();
      return {
        role,
        text: trimmedText,
        time,
      };
    })
    .filter(Boolean);
};

const respondWithChat = (res, chat, status = 200) => {
  const payload = chat?.toObject ? chat.toObject() : chat;
  return res.status(status).json(payload);
};

//  Get all chats for the logged-in user
exports.getChats = async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.find({ user: userId }).sort({ updatedAt: -1 }).lean();
    res.status(200).json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error fetching chats' });
  }
};

//  Create a new chat
exports.createChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, messages } = req.body || {};

    const sanitizedMessages = sanitizeMessages(messages);
    const explicitTitle = sanitizeTitle(title);
    const derivedTitle = deriveTitleFromMessages(sanitizedMessages);
    const finalTitle = explicitTitle || derivedTitle || 'New Chat';

    const chat = await Chat.create({
      user: userId,
      title: finalTitle,
      messages: sanitizedMessages,
    });

    return respondWithChat(res, chat, 201);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error creating chat' });
  }
};

// Append messages to an existing chat
exports.appendMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { messages } = req.body || {};

    const sanitizedMessages = sanitizeMessages(messages);
    if (!sanitizedMessages.length) {
      return res.status(400).json({ message: 'A non-empty messages array is required.' });
    }

    const chat = await Chat.findOne({ _id: chatId, user: userId });
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    chat.messages.push(...sanitizedMessages);

    if (!chat.title || chat.title === 'New Chat') {
      const fallbackTitle = deriveTitleFromMessages(chat.messages);
      if (fallbackTitle) {
        chat.title = fallbackTitle;
      }
    }

    await chat.save();
    return respondWithChat(res, chat);
  } catch (error) {
    console.error('Error appending messages to chat:', error);
    res.status(500).json({ message: 'Server error updating chat messages' });
  }
};

// Update chat metadata (title, archive state, etc.)
exports.updateChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;
    const { title, archived } = req.body || {};

    const updates = {};
    if (typeof title === 'string') {
      const cleanTitle = sanitizeTitle(title);
      if (!cleanTitle) {
        return res.status(400).json({ message: 'Title must contain at least one visible character.' });
      }
      updates.title = cleanTitle;
    }

    if (typeof archived === 'boolean') {
      updates.archived = archived;
      updates.archivedAt = archived ? new Date() : null;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ message: 'No valid fields provided for update.' });
    }

    const chat = await Chat.findOneAndUpdate({ _id: chatId, user: userId }, updates, {
      new: true,
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    return respondWithChat(res, chat);
  } catch (error) {
    console.error('Error updating chat:', error);
    res.status(500).json({ message: 'Server error updating chat' });
  }
};

// Delete a chat permanently
exports.deleteChat = async (req, res) => {
  try {
    const userId = req.user.id;
    const { chatId } = req.params;

    const result = await Chat.deleteOne({ _id: chatId, user: userId });
    if (!result.deletedCount) {
      return res.status(404).json({ message: 'Chat not found.' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error deleting chat' });
  }
};
