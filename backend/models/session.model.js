const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    session_id: {
        type: String,
        unique: true,
        required: true
    },
    expiry_time: {
        type: Date,
        required: true
    },
    login_time: {
        type: Date,
        required: true
    },
    logout_time: {
        type: Date,
        default: null
    }
});

const SessionModel = mongoose.model('session', sessionSchema);

module.exports = SessionModel;
