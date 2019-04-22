var mongoose = require('mongoose')

var auto = mongoose.Schema({
    messageReceived: Boolean,
    messageSent: String,
    messageAverage: String
});




module.exports = mongoose.model("AUTO", auto);