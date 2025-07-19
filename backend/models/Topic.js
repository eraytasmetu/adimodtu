const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Topic', TopicSchema);