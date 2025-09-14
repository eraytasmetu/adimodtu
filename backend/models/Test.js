const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionOptionSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  audio: {
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
});

const QuestionSchema = new Schema({
  text: {
    type: String,
    required: true,
  },
  questionAudio: {
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
  options: {
    type: [QuestionOptionSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length >= 2,
  },
  correctAnswer: {
    type: String,
    required: true,
  },
  solutionText: {
    type: String,
    required: false,
  },
  solutionAudio: {
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
});

const TestSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  unit: {
    type: Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  questions: [QuestionSchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Test', TestSchema);