var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var db = require('../helpers/database')
var bodyParser = require('body-parser');
var encodedParser = bodyParser.urlencoded({
    extended: true
});

const JSON = require('circular-json');

var json = "";


// Creating report object from report.js
SERA = require('../helpers/report_Schema')

/*router.get('/get_reports', async (req, res) => {
    SERA.find({}, function (error, reply) {
        if (!error) {
            res.send(reply);
        } else {
            console.log("Error fetching users")
        }
    });
    console.log(results);
    json = JSON.stringify(results);
    res.send(json);
});*/

// this will display from mongo the saved reports
router.post('/', async (req, res) => {
    SERA.find({}, function (error, reply) {
        if (!error) {
            res.send(reply);
        } else {
            console.log("Error fetching users")
        }
    });

    // Filter results
    results = results.filter((result, index) => {
        return !results.slice(index).find(
            sresult => sresult.subject === result.subject
        );
    });

    console.log(results);
    json = JSON.stringify(results);
    res.send(json);
})

router.get('/', async (req, res) => {
    let parms = {
        title: 'Report',
        active: {
            report2: true
        },
        saveSuccess: !!req.query.success
    };


    // get from mongo
    // render
    // req.query.dateFrom req.query.dateEnd
    console.log("I am in thet GET route")
    // res.render('reports', function (error, html) {
    //     if (error) {
    //         console.log("The error is" + error);
    //     } else {
    //         // console.log("The view was rendered")
    //         // console.log(html)
    //         res.render(html);
    //         // res.status(201).send({
    //         //     message: "Good Job"
    //         // });
    //     }
    // });

    // try {
    // This will get all data from mongo and render to reports view


    // // parms.reports = result.value;
    // // console.log(result);
    // // parms.saveSuccess = true
    // res.redirect('reports')
    // // res.render('reports', parms);


    // } catch (error) {
    //     console.log(error)
    // }

    res.render('reports')
});



// Posting Email
// post form with a link
// or ajax to redirect after
router.post('/save', async function (req, res) {
    console.log(req.body); // nothing here empty
    let parms = {
        title: 'Report',
        active: {
            report: true
        }
    };
    console.log('In save');

    // get token and username from input of email
    // must be able to get the accessToken and username because I am not 
    // seeing the value array I get back from the api
    // change back to teh way it was before. Username will be in req.cookies
    // const {
    //     token: accessToken,
    //     userName
    // } = await authHelper.getAccessToken(req.cookies.graph_user_name, res);

    const accessToken = await authHelper.getAccessToken(req.cookies, res);
    const userName = req.cookies.graph_user_name;
    console.log(req.cookies) // get back access_token
    console.log(userName) // getting back undefined
    console.log(userName); // getting back undefined
    console.log(accessToken) // getting null 

    //console.log(userName)
    if (accessToken && userName) {
        parms.user = userName;

        // Initialize Graph client
        const client = graph.Client.init({
            authProvider: (done) => {
                done(null, accessToken);
            }
        });

        try {
            // Get the 10 newest messages from inbox
            const result = await client
                .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu"')
                //api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq '@student.gsu.edu'")
                //api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
                .top(5)
                .select('subject,from,receivedDateTime,isRead,sentDateTime')
                // .orderby('receivedDateTime DESC')
                .count(true)
                .get();

            // array  - loop throught array

            // const report = new SERA({
            //     receivedDateTime: result.value[0].receivedDateTime,

            //     sentDateTime: result.value[1].sentDateTime
            //     //
            // });
            //to push everything

            // here we map the values we get back from the API
            // to each propety in our schema
            const toSave = result.value.map(value => ({
                isRead: value.isRead,
                subject: value.subject,
                from: value.from.emailAddress.emailAddress,
                receivedDateTime: value.receivedDateTime,
                sentDateTime: value.sentDateTime
            }));

            // now we save it to the database
            SERA.insertMany(toSave, function (error, success) {
                if (error) {
                    console.log("There has been an error inserting", error)
                    return res.render('error', {})
                }
                parms.reports = result.value;
                console.log(result);
                parms.saveSuccess = true
                res.redirect('/mail?success=true')
                // res.render('reports', parms);
            });
            // save stores into database
            // SERA.save().then(result => {
            //     console.log(result)
            // }).catch(function (error) {
            //     console.log("The error is " + error)
            // });
            /*res.status(201).json({
                message: "Handling post request to /api/report",
                createdReport: report
            });
            */



        } catch (err) {
            console.log(err);
            parms.message = 'Error retrieving messages';
            parms.error = {
                status: `${err.code}: ${err.message}`,
            };
            console.log("Error getting messages")
            parms.debug = JSON.stringify(err.body, null, 2);
            res.render('error', parms);
        }

        // If we dont have the accessToken and userName
    } else {
        console.log("You got an error")
    }

    //     console.log("I have been hit")
});








module.exports = router;