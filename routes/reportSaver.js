var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var JSON = require('circular-json');
var json = "";



// Creating report object from report.js
SERA = require('../helpers/report_Schema')


// this will display from mongo the saved reports
router.post('/', async (req, res) => {
    let parms = {
        title: 'Report',
        active: {
            report: true
        }
    };

    SERA.find({}, function (error, reply) {
        if (!error) {
            if (req.query.startdate && req.query.enddate) {
                const startdate = new Date(req.query.startdate);
                const enddate = new Date(req.query.enddate);

                // Filters by date range
                reply = reply.filter((result) => {
                    const date = new Date(result.receivedDateTime);
                    return date > startdate && date < enddate;
                });
            }
            

            // Sends result
            res.send(reply);
        } else {
            console.log("Error fetching users")
        }
    });

    // // Filter results
    // I commented this to see if it made changes
    // uncomment later if you feel that you should

    // results = results.filter((result, index) => {
    //     return !results.slice(index).find(
    //         sresult => sresult.subject === result.subject
    //     )
    // });

    // console.log("This is the results " + results);

    // uncomment this. goes with results
    // json = JSON.stringify(results);
    // res.send(json);


    // res.send(JSON.stringify(req.query));
    // res.send('test')
});

router.get('/', async (req, res) => {
    let parms = {
        title: 'Report',
        active: {
            myReport: true
        }
    };

    // we wait for the access token whhich is stored in the request.cokies
    const accessToken = await authHelper.getAccessToken(req.cookies, res);
    // the username is stored in the request.cookies
    const userName = req.cookies.graph_user_name;

    // if we have both
    if (accessToken && userName) {
        // username is stored in parms.user. This is the name of the person logged in. Displayed on
        // index.hbs
        parms.user = userName;



        // Trying to get specifc emails with dates from API 
        // instead of having to save.
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

            // now in our autoreports.hbs we loop through the mohamed value
            // which is everthing we get back from the API
            parms.mohamed = result.value;



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

    // get from mongo
    // render
    // req.query.dateFrom req.query.dateEnd
    console.log("I am in thet GET route");

    res.render('reports', parms);
});



















// Posting Email
// post form with a link
// or ajax to redirect after
// This route is for when the user clicks the save report button
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
                // from: value.from.emailAddress,
                receivedDateTime: value.receivedDateTime,
                sentDateTime: value.sentDateTime
            }));

            // now we save it to the database
            SERA.insertMany(toSave, function (error) {
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