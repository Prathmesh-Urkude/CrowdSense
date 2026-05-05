import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  rating:{
    type: Number,
    required: true,
    min: 1,
    max: 5,
    default: 1
  },
  comment: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default UserFeedback = mongoose.model('UserFeedback', feedbackSchema);