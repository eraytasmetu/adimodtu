const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
  questionAudioUrl: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  correctAnswer: {
    type: String,
    required: true,
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