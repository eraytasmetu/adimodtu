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