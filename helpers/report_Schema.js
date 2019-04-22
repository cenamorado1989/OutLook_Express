var mongoose = require('mongoose')

var sera = mongoose.Schema({
    isRead: Boolean,
    subject: String,
    from: String,
    name: String,
    receivedDateTime: Date,
    sentDateTime: Date,
    type: String,
    conversationId: String
});




module.exports = mongoose.model("SERA", sera);