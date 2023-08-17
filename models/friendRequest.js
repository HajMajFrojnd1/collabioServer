const mongoose = require('mongoose');

const FriendRequestSchema = mongoose.Schema({
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    toUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    timestamp:{
        type: Date,
        default: Date.now()
    },
    accepted: {
        type: Boolean,
        default: false
    }
})


const FriendRequest = mongoose.models.FriendRequest || mongoose.model("FriendRequest", FriendRequestSchema);

module.exports = FriendRequest;