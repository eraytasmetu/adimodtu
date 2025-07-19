const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UnitSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Unit', UnitSchema);