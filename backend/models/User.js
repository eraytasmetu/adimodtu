const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
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
  role: {
    type: String,
    enum: ['user', 'admin'], 
    default: 'user', 
  },
  completedUnits: [
    {
      type: Schema.Types.ObjectId,
      ref: 'unit', 
    },
  ],
  completedTopics: [
    {
      type: Schema.Types.ObjectId,
      ref: 'topic', 
    },
  ],
  completedTests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'test', 
    },
  ],
  listenedTopics: [
    {
      topicId: {
        type: Schema.Types.ObjectId,
        ref: 'topic',
      },
      listenedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  completedQuestions: [
    {
      questionId: {
        type: Schema.Types.ObjectId,
        ref: 'test',
      },
      testId: {
        type: Schema.Types.ObjectId,
        ref: 'test',
      },
      isCorrect: {
        type: Boolean,
        required: true,
      },
      completedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  lastActivity: {
    activityType: {
      type: String,
      enum: ['Topic', 'Test', null], 
      default: null,
    },
    activityId: {
      type: Schema.Types.ObjectId,
      refPath: 'lastActivity.activityType', 
      default: null,
    },
  },
});

module.exports = mongoose.model('user', UserSchema);