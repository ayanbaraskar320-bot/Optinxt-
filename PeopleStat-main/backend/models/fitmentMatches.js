const mongoose = require('mongoose');
const { Schema } = mongoose;

const FitmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee' },
  jdId: { type: Schema.Types.ObjectId, ref: 'JobDescription' },
  matchScore: Number,
  matchedSkills: [String],
  missingSkills: [String],
  reasons: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FitmentMatch', FitmentSchema);
