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
  audio: {
    data: {
      type: Buffer,
      required: true,
    },
    contentType: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    }
  },
  titleAudio: {
    data: {
      type: Buffer,
      required: false,
    },
    contentType: {
      type: String,
      required: false,
    },
    filename: {
      type: String,
      required: false,
    },
    size: {
      type: Number,
      required: false,
    }
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