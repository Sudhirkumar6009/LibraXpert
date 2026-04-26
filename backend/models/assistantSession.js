const mongoose = require('mongoose');

const assistantSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  messages: [{
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    mode: { type: String, enum: ['explain', 'next-step', 'quiz', 'summary', 'weakness'] },
    timestamp: { type: Date, default: Date.now }
  }],
  userProgress: {
    borrowedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    completedBooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Book' }],
    weakAreas: [String],
    interests: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AssistantSession', assistantSessionSchema);
