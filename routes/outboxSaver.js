var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var JSON = require('circular-json');
var json = "";



// Creating report object from report.js
OUTBOX = require('../helpers/outbox_Schema')


function getOutbox(client) {
    return client
        .api('/me/mailfolders/sentitems/messages?$search= "from:@student.gsu.edu"')
        .top(5)
        .select('subject,from,receivedDateTime,isRead,sentDateTime,conversationId')
        // .orderby('receivedDateTime DESC')
        .count(true)
        .get();
}


function format(values, type) {
    return values.map(value => ({
        isRead: value.isRead,
        subject: value.subject,
        from: value.from.emailAddress.address,
        name: value.from.emailAddress.name,
        receivedDateTime: value.receivedDateTime,
        sentDateTime: value.sentDateTime,
        conversationId: value.conversationId
    }));
}

/*
    When we go to the My Reports tab, 50 most recent reports are shown.
*/
router.get('/', async (req, res) => {

    let parms = {
        title: 'Outbox',
        active: {
            myOutbox: true
        }
    };

    // Here we check if the email is already in the database
    const checkIFAlreadyHasData = await OUTBOX.find().countDocuments();
    if (checkIFAlreadyHasData) {
        return res.render('outbox', parms);
    }

    // we wait for the access token whhich is stored in the request.cokies
    const accessToken = await authHelper.getAccessToken(req.cookies, res);
    // the username is stored in the request.cookies
    const userName = req.cookies.graph_user_name;
    console.log('Token', accessToken, userName);
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
            console.log('Fetching emails');
            // Get the 10 newest messages from inbox
            const [outbox] = await Promise.all([
                getOutbox(client)
            ]);

            // now in our autoreports.hbs we loop through the mohamed value
            // which is everthing we get back from the API

            /*
                What I am trying to do here is that as soon as the API
                is called when we go to the page, we save everything.
                Now that we saved it, we should only get back mails
                based on the date we select.
            */
            const toSave = [
                ...format(outbox.value, 'outbox')
            ];

            parms.emails = toSave;
            parms.outboxTotal = outbox.value.length;
            console.log('Outbox', outbox.value[0]);
            console.log('to Save', toSave[0]);

            // now we save it to the database
            OUTBOX.insertMany(toSave, function (error) {
                if (error) {
                    console.log("There has been an error inserting", error)
                    return res.render('error', {})
                } else {
                    console.log("You have successfully saved to the database")
                }
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

    // get from mongo
    // render
    // req.query.dateFrom req.query.dateEnd
    console.log("I am in thet GET route");

    res.render('outbox', parms);


});


router.post('/', async (req, res) => {
    let parms = {
        title: 'Outbox',
        active: {
            my_outbox: true
        }
    };
    const {
        startdate,
        enddate
    } = req.body;
    console.log("========", req.body);
    if (!startdate && !enddate) {
        res.status(400);
        return res.send('Please select start and end dates');
    }
    /*
    Here we query the db and get based on the selected dates
    Uncomment to go back to old way

  */
    try {
        const findDates = await OUTBOX.find().lean().exec();
        const parseStartdate = new Date(startdate);
        const parseEnddate = new Date(enddate);

        // Filters by date range

        const filterDateSelections = findDates.filter((result) => {
            const date = new Date(result.receivedDateTime).getTime();

            return date >= parseStartdate.getTime() && date <= parseEnddate.getTime();
        });
        return res.send(filterDateSelections);
    } catch (e) {
        console.log(e, 'an eror');
    }

    OUTBOX.find({}, function (error, reply) {
        if (!error) {
            // Sends result
            res.send(reply);
            console.log("I am sending the filtered emails")
        } else {
            console.log("There is a problem filtering emails")
        }
    });




    // // I am trying to get the the API directly instead of the DB so I call the API here
    // const accessToken = await authHelper.getAccessToken(req.cookies, res);
    // const userName = req.cookies.graph_user_name;



    // if (accessToken && userName) {
    //     parms.user = userName;

    //     // Initialize Graph client
    //     const client = graph.Client.init({
    //         authProvider: (done) => {
    //             done(null, accessToken);
    //         }
    //     });

    //     try {
    //         // Get the 10 newest messages from inbox
    //         const result = await client
    //             .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu"')
    //             //api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq '@student.gsu.edu'")
    //             //api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
    //             .top(50)
    //             .select('subject,from,receivedDateTime,isRead,sentDateTime')
    //             // .orderby('receivedDateTime DESC')
    //             .count(true)
    //             .get();




    //         // the parms.mohamed is what the mail.hbs uses to loop through the 
    //         // result array and then display it
    //         parms.mohamed = result.value;

    //         // The file to display what we get back from the results.value
    //         res.render('reports', parms);

    //         console.log(result.value)



    //     } catch (err) {
    //         console.error(err);
    //         parms.message = 'Error retrieving messages';
    //         parms.error = {
    //             status: `${err.code}: ${err.message}`
    //         };
    //         parms.debug = JSON.stringify(err.body, null, 2);
    //         res.render('error', parms);
    //     }
    //     // if we dont have the accessToken and username?
    // } else {
    //     // Redirect to home
    //     res.redirect('/');
    // }

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





















/* Posting Email
Dont mess with this. Works fine.
This route is for when the user clicks the save report button
*/
router.post('/save', async function (req, res) {
    console.log(req.body); // nothing here empty
    let parms = {
        title: 'Outbox',
        active: {
            my_outbox: true
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
                .api('/me/mailfolders/sentitems/messages?$search= "from:@student.gsu.edu')
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
            OUTBOX.insertMany(toSave, function (error) {
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