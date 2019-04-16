    var express = require('express');
    var router = express.Router();
    var authHelper = require('../helpers/auth');
    var graph = require('@microsoft/microsoft-graph-client');
    var JSON = require('circular-json');
    var json = "";



    // Creating report object from report.js
    SERA = require('../helpers/report_Schema');
    OUTBOX = require('../helpers/outbox_Schema');


    function getOutbox(client) {
        return client
            .api('/me/mailfolders/sentitems/messages?$search= "from:@student.gsu.edu"')
            .top(5)
            .select('subject,from,receivedDateTime,isRead,sentDateTime,conversationId')
            // .orderby('receivedDateTime DESC')
            .count(true)
            .get();
    }

    function getInbox(client) {
        return client
            .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu"')
            //api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq '@student.gsu.edu'")
            //api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
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
        This function will get us the number of outbox messages sent
    */
    const getTotalResponses = async () => {
        //get outbox comversations
        const getOutbox = await OUTBOX.find({}).lean().exec();

        //filters through outboxes based on conversationid and return counts in the response
        const getCountWithMatchingIds = await Promise.all(getOutbox.map(async outbox => {
            //get inbox conversationIds
            const getInboxConvIds = await SERA.findOne({
                conversationId: outbox.conversationId
            }).select('conversationId').lean().exec();
            if (getInboxConvIds && outbox.conversationId === getInboxConvIds.conversationId) {
                console.log(outbox);
                return {
                    ...outbox,
                    count: 1
                };
            }
        }));
        const normalizeData = getCountWithMatchingIds.filter(r => !!r);
        //we need unqieu results with count
        //we have an array, checkif index exists then increase count.
        let conversations = [],
            count = 1;
        const sortData = normalizeData.filter(outbox => {
            const checkIfInArr = conversations.find(e => e.conversationId === outbox.conversationId);
            if (checkIfInArr) {
                const getIndex = conversations.findIndex(e => e.conversationId === outbox.conversationId);
                const getObject = conversations[getIndex];
                conversations[getIndex] = {
                    ...conversations[getIndex],
                    count: conversations[getIndex].count + 1
                }
            } else {

                conversations.push({
                    ...outbox,
                    count: 1
                });
            }
        });

        const totalOutboxes = conversations.reduce((acc, curr) =>
            acc + curr.count, 0)
        const result = {
            // This holds actual total outboxes for the time frame
            mohamedOutbox: totalOutboxes,
            conversations: conversations
        }
        // result.totalOutboxes is the value for actual emails
        console.log("========This is the outbox global", result.totalOutboxes)
        return result;
    };


    const getInboxResponses = async () => {
        //get outbox comversations
        const getInbox = await SERA.find({}).lean().exec();

        //filters through outboxes based on conversationid and return counts in the response
        const getCountWithMatchingIds = await Promise.all(getInbox.map(async inbox => {
            //get inbox conversationIds
            const getInboxConvIds = await OUTBOX.findOne({
                conversationId: inbox.conversationId
            }).select('conversationId').lean().exec();
            if (getInboxConvIds && inbox.conversationId === getInboxConvIds.conversationId) {
                console.log(inbox);
                return {
                    ...inbox,
                    count: 1
                };
            }
        }));
        const normalInbox = getCountWithMatchingIds.filter(r => !!r);
        //we need unqieu results with count
        //we have an array, checkif index exists then increase count.
        let conversations = [],
            count = 1;
        const sortData = normalInbox.filter(inbox => {
            const checkIfInArr = conversations.find(e => e.conversationId === inbox.conversationId);
            if (checkIfInArr) {
                const getIndex = conversations.findIndex(e => e.conversationId === inbox.conversationId);
                const getObject = conversations[getIndex];
                conversations[getIndex] = {
                    ...conversations[getIndex],
                    count: conversations[getIndex].count + 1
                }
            } else {

                conversations.push({
                    ...inbox,
                    count: 1
                });
            }
        });

        const totalInboxes = conversations.reduce((acc, curr) =>
            acc + curr.count, 0)
        const result = {
            // this holds the actual count of emails for the time period
            mohamedInbox: totalInboxes,
            conversations: conversations
        }
        console.log("==========This is the global for inboxes", result)

        return result;

    };




    /*
        When we go to the My Reports tab, 50 most recent reports are shown.
    */
    router.get('/', async (req, res) => {

        let parms = {
            title: 'Report',
            active: {
                myReport: true
            }
        };

        // Here we check if the email is already in the database
        const checkIFAlreadyHasData = await SERA.find().countDocuments();
        if (checkIFAlreadyHasData) {
            console.log('I already have data');
            return res.render('reports', parms);
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

            const client = graph.Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                }
            });

            try {
                console.log('Fetching emails');
                // Get the 10 newest messages from inbox
                const [inbox, outbox] = await Promise.all([
                    getInbox(client),
                    getOutbox(client)
                ])

                // now in our autoreports.hbs we loop through the mohamed value
                // which is everthing we get back from the API

                /*
                    What I am trying to do here is that as soon as the API
                    is called when we go to the page, we save everything.
                    Now that we saved it, we should only get back mails
                    based on the date we select.
                */
                const toSave = [
                    ...format(inbox.value, 'inbox'),
                    ...format(outbox.value, 'outbox')
                ];

                parms.emails = toSave;
                // parms.outboxTotal = outbox.value.length;
                parms.inboxTotal = inbox.value.length;
                console.log("This is the number of inbox emails", inbox.value.length)
                console.log('Outbox', outbox.value[0]);
                console.log('Inbox', inbox.value[0]);
                console.log('to Save', toSave[0]);

                // now we save it to the database
                SERA.insertMany([...format(inbox.value, 'inbox')], function (error) {
                    if (error) {
                        console.log("There has been an error inserting", error)
                        return res.render('error', {})
                    } else {
                        console.log("You have successfully saved to the database")
                    }
                });
                OUTBOX.insertMany([...format(outbox.value, 'outbox')], function (error) {
                    if (error) {
                        console.log("There has been an error inserting", error)
                        return res.render('error', {})
                    } else {
                        console.log("You have successfully saved to the database")
                    }
                });


                const myInboxOBJ = await getTotalResponses();

                const theTotalOutboxCount = myInboxOBJ.result;
                console.log('------------------------------------------')
                console.log("This is the inbox count outside", theTotalOutboxCount);



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
        const response = {
            data: {
                ...parms
            },
            outboxCount: {
                ...getTotalResponses(),
                mohamedOutboxCount: getTotalResponses.totalOutboxes
            },
            inboxCount: {
                ...getInboxResponses(),
                mohamedInboxCount: getInboxResponses.totalInboxes
            }


        };
        console.log('Response is');
        res.render('reports', response);

        /*
        Trying to get sent email by calling API again.
        To get the messages you sent
        https://graph.microsoft.com/v1.0/me/mailFolders/sentitems
           */

    });



    // this will display from mongo the saved reports
    /*
       this will display from mongo the saved reports
        What I need to do here is instead of pulling from the database,
        I need to get the emails directly from the API and then filter it
        based on the date. After that display the number of emails recieved, sent, and the average
        average = recieved/sent or vice versa
    */
    router.post('/', async (req, res) => {
        let parms = {
            title: 'Report',
            active: {
                report: true
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
            const findDates = await SERA.find().lean().exec();
            const parseStartdate = new Date(startdate);
            const parseEnddate = new Date(enddate);

            // Filters by date range
            const filterDateSelections = findDates.filter((result) => {
                const date = new Date(result.receivedDateTime).getTime();
                return date >= parseStartdate.getTime() && date <= parseEnddate.getTime();
            });
            // gets count of outbox messages
            const getConvoCounts = await getTotalResponses();
            // get count of inbox messages
            const getInboxCounts = await getInboxResponses();
            // call inbox logic for counting here
            console.log(getConvoCounts);

            const filterCounts = filterDateSelections.map(ft => {
                return getConvoCounts.conversations.filter(gC => gC.conversationId === ft.conversationId);

            });

            const filterInbox = filterDateSelections.map(ft => {
                return getInboxCounts.conversations.filter(gc => gc.conversationId === ft.conversationId);
            });

            const response = {
                data: filterDateSelections,
                outboxCount: {
                    filteredCount: filterCounts.length,
                    ...getConvoCounts
                },
                data2: filterDateSelections,
                inboxCount: {
                    filteredCount: filterInbox.length,
                    ...getInboxCounts
                }
            };



            parms.outboxTotal = filterCounts.length;
            parms.inboxTotal = filterInbox.length;
            console.log("This is the number of inbox emails", filterInbox.length);
            console.log("This is the number of outbox emails", filterCounts.length);
            return res.send(response);
        } catch (e) {
            console.log(e, 'an eror');
        }

        SERA.find({}, function (error, reply) {
            if (!error) {
                // Sends result
                res.send(reply);
                console.log("I am sending the filtered emails")
            } else {
                console.log("There is a problem filtering emails")
            }
        });

    });


    /* Posting Email
    Dont mess with this. Works fine.
    This route is for when the user clicks the save report button
    */
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