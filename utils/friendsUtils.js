
const formatFriendRequest = (request, userString) => {
    return {
        _id: request._id,
        user: request[userString],
        accepted: request.accepted,
        timestamp: request.timestamp
    }
}

module.exports = {formatFriendRequest};