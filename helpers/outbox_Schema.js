var mongoose = require('mongoose')

var my_outbox = mongoose.Schema({
    isRead: Boolean,
    subject: String,
    from: String,
    name: String,
    receivedDateTime: Date,
    sentDateTime: Date,
    type: String,
    conversationId: String
});




module.exports = mongoose.model("OUTBOX", my_outbox);