var express = require('express')
var mongoose = require('mongoose')
const router = express.Router()

// Creating report object from report.js
Report = require('./report_Schema')

SERA = require('../helpers/report_Schema')

// connecting to mongoose 
mongoose.connect("mongodb+srv://mohamedali:" + process.env.MONGO_ATLAS_PW + "@sera-outlook-edxbb.mongodb.net/test?retryWrites=true", {})

// Testing connection to mongodb
var db = mongoose.connection;
// error checking
db.on("error", function (error) {
    console.log(error)
});




// connection success 
db.once("open", function (callback) {
    console.log("Connection succeeded.");
});



/*
    This get and post was created to understand better how to make 
    connections and also post to mongo
*/
router.get('/', function (req, res) {
    res.status(200).json({
        message: 'Handling GET Requests to Database'
    });
});

router.post('/proute', function (req, res) {
    const report = new SERA({
        _id: new mongoose.Types.ObjectId(),
        firstname: req.body.firstname,
        lastname: req.body.lastname
    });


    // save stores into database
    report.save().then(result => {
            console.log("This is the result" + result)
        })
        // error checking
        .catch(function (error) {
            console.log(error)
        });

    res.status(201).json({
        message: "Handling post request to /api/report",
        createdReport: report
    });
});






module.exports = router
// var TheReport = mongoose.model("TheReport", Report.reportSchema)