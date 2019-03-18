var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var db = require('../helpers/database')

// Creating report object from report.js
SERA = require('../helpers/report_Schema')


// Posting Email
router.post('/save', async function (req, res) {
    let parms = {
        title: 'Inbox',
        active: {
            inbox: true
        }
    };


    // get token and username from input of email
    // must be able to get the accessToken and username because I am not 
    // seeing the value array I get back from the api
    // change back to teh way it was before. Username will be in req.cookies
    const {
        token: accessToken,
        userName
    } = await authHelper.getAccessToken(req.cookies, res);
    //const userName = req.cookies.graph_user_name;
    console.log(userName);

    if (true) {
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

            const report = new SERA({
                receivedDateTime: result.value[0].receivedDateTime,
                
                sentDateTime: result.value[1].sentDateTime
                //
            });
            //to push everything
           // report.insertMany(result.value)
            // save stores into database
            report.save().then(result => {
                    console.log(result)
                })
                // error checking
                // promise
                .catch((err) => console.log(err))

            res.status(201).json({
                message: "Handling post request to /api/report",
                createdReport: report
            });


        } catch (err) {
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