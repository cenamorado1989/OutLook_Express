var express = require('express')
var mongoose = require('mongoose')
const router = express.Router()

// Creating report object from report.js
Report = require('./report_Schema')

// connecting to mongoose 
mongoose.connect("mongodb+srv://mohamedali:" + process.env.MONGO_ATLAS_PW + "@sera-outlook-edxbb.mongodb.net/test?retryWrites=true", {})

// Testing connection to mongodb
var db = mongoose.connection;
// error checking
db.on("error", console.error.bind(console, "connection error"));
// connection success 
db.once("open", function (callback) {
    console.log("Connection succeeded.");
});




router.get('/', function (req, res) {
    res.status(200).json({
        message: 'Handling GET Requests to Database'
    });
});

router.post('/proute', function (req, res) {
    const report = new Report({
        _id: new mongoose.Types.ObjectId(),
        firstname: req.body.firstname,
        lastname: req.body.lastname
    });
    // save stores into database
    report.save().then(result => {
            console.log(result)
        })
        // error checking
        .catch(err => console.log(err))

    res.status(201).json({
        message: "Handling post request to /api/report",
        createdReport: report
    });
});






module.exports = router
// var TheReport = mongoose.model("TheReport", Report.reportSchema)