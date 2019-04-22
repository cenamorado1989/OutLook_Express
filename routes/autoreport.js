var express = require("express");
var router = express.Router();
var authHelper = require("../helpers/auth");
var Agenda = require("agenda");
const sgMail = require("@sendgrid/mail");

/*
  Get method when the page is hit. For now it just renders the page and nothing else
 */
router.get("/", async function(req, res) {
  let parms = {
    title: "Schedule",
    active: {
      schedule: true
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
  }

  res.render("autoreports", parms);
});

("==================================================================================================");

function getOutbox(client) {
  return (
    client
      .api(
        '/me/mailfolders/sentitems/messages?$search= "from:@student.gsu.edu"'
      )
      .top(500)
      .select(
        "subject,from,receivedDateTime,isRead,sentDateTime,conversationId"
      )
      // .orderby('receivedDateTime DESC')
      .count(true)
      .get()
  );
}

function getInbox(client) {
  return (
    client
      .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu"')
      //api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq '@student.gsu.edu'")
      //api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
      .top(500)
      .select(
        "subject,from,receivedDateTime,isRead,sentDateTime,conversationId"
      )
      // .orderby('receivedDateTime DESC')
      .count(true)
      .get()
  );
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
  const getOutbox = await OUTBOX.find({})
    .lean()
    .exec();

  //filters through outboxes based on conversationid and return counts in the response
  const getCountWithMatchingIds = await Promise.all(
    getOutbox.map(async outbox => {
      //get inbox conversationIds
      const getInboxConvIds = await SERA.findOne({
        conversationId: outbox.conversationId
      })
        .select("conversationId")
        .lean()
        .exec();
      if (
        getInboxConvIds &&
        outbox.conversationId === getInboxConvIds.conversationId
      ) {
        console.log(outbox);
        return {
          ...outbox,
          count: 1
        };
      }
    })
  );
  const normalizeData = getCountWithMatchingIds.filter(r => !!r);
  //we need unqieu results with count
  //we have an array, checkif index exists then increase count.
  let conversations = [],
    count = 1;
  const sortData = normalizeData.filter(outbox => {
    const checkIfInArr = conversations.find(
      e => e.conversationId === outbox.conversationId
    );
    if (checkIfInArr) {
      const getIndex = conversations.findIndex(
        e => e.conversationId === outbox.conversationId
      );
      const getObject = conversations[getIndex];
      conversations[getIndex] = {
        ...conversations[getIndex],
        count: conversations[getIndex].count + 1
      };
    } else {
      conversations.push({
        ...outbox,
        count: 1
      });
    }
  });

  const totalOutboxes = conversations.reduce(
    (acc, curr) => acc + curr.count,
    0
  );
  const result = {
    // This holds actual total outboxes for the time frame
    mohamedOutbox: totalOutboxes,
    conversations: conversations
  };
  // result.totalOutboxes is the value for actual emails
  console.log("========This is the outbox global", result.totalOutboxes);
  return result;
};

const getInboxResponses = async () => {
  //get outbox comversations
  const getInbox = await SERA.find({})
    .lean()
    .exec();

  //filters through outboxes based on conversationid and return counts in the response
  const getCountWithMatchingIds = await Promise.all(
    getInbox.map(async inbox => {
      //get inbox conversationIds
      const getInboxConvIds = await OUTBOX.findOne({
        conversationId: inbox.conversationId
      })
        .select("conversationId")
        .lean()
        .exec();
      if (
        getInboxConvIds &&
        inbox.conversationId === getInboxConvIds.conversationId
      ) {
        console.log(inbox);
        return {
          ...inbox,
          count: 1
        };
      }
    })
  );
  const normalInbox = getCountWithMatchingIds.filter(r => !!r);
  //we need unqieu results with count
  //we have an array, checkif index exists then increase count.
  let conversations = [],
    count = 1;
  const sortData = normalInbox.filter(inbox => {
    const checkIfInArr = conversations.find(
      e => e.conversationId === inbox.conversationId
    );
    if (checkIfInArr) {
      const getIndex = conversations.findIndex(
        e => e.conversationId === inbox.conversationId
      );
      const getObject = conversations[getIndex];
      conversations[getIndex] = {
        ...conversations[getIndex],
        count: conversations[getIndex].count + 1
      };
    } else {
      conversations.push({
        ...inbox,
        count: 1
      });
    }
  });

  const totalInboxes = conversations.reduce((acc, curr) => acc + curr.count, 0);
  const result = {
    // this holds the actual count of emails for the time period
    mohamedInbox: totalInboxes,
    conversations: conversations
  };
  console.log("==========This is the global for inboxes", result);

  return result;
};

/*
         When we go to the My Reports tab, 50 most recent reports are shown.
     */
router.post("/", async (req, res) => {
  let parms = {
    title: "Report",
    active: {
      report: true
    }
  };
  const {
    // the start day from the user
    startdate,
    // the end day from the user
    enddate
  } = req.body;
  console.log("This has the start and end date from the user", req.body);
  if (!startdate && !enddate) {
    res.status(400);
    return res.send("Please select start and end dates");
  }
  /*
           Here we query the db and get based on the selected dates
           Uncomment to go back to old way
      
         */
  try {
    const findDates = await SERA.find()
      .lean()
      .exec();
    // hold the users start and endate into variables
    const parseStartdate = new Date(startdate);
    const parseEnddate = new Date(enddate);

    // Filters by date range
    // returns dates greater then and equal to startdate and dates less and equal to endate
    const filterDateSelections = findDates.filter(result => {
      const date = new Date(result.receivedDateTime).getTime();
      return date >= parseStartdate.getTime() && date <= parseEnddate.getTime();
    });
    // gets count of outbox messages
    const getConvoCounts = await getTotalResponses();
    // get count of inbox messages
    const getInboxCounts = await getInboxResponses();
    // call inbox logic for counting here
    console.log(getConvoCounts);

    // here we map the dates we filtered to the dates we get back from the getTotalResponses() function
    const filterCounts = filterDateSelections.map(ft => {
      return getConvoCounts.conversations.filter(
        gC => gC.conversationId === ft.conversationId
      );
    });
    // here we map the dates we filtered to the dates we get back from the getInboxCounts() function
    const filterInbox = filterDateSelections.map(ft => {
      return getInboxCounts.conversations.filter(
        gc => gc.conversationId === ft.conversationId
      );
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

    console.log(
      "Filtered Inbox Count =========>",
      response.inboxCount.mohamedInbox
    );

    parms.outboxTotal = filterCounts.length;
    parms.inboxTotal = filterInbox.length;

    /*
            if the user selects a start and endate which is less than the current date,
            we will go ahead and send the report immediatly using SendGrid. Else we will
            schedule a job based on the start date and end date they select. If they schedule 
            a start and end date for the same day, we will send the report to them at the end of 
            the day.
         */
    //  var today = new Date();
    //  var dd = String(today.getDate()).padStart(2, '0');
    //  var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    //  var yyyy = today.getFullYear();

    //  today = mm + '/' + dd + '/' + yyyy;
    if (parseStartdate && parseEnddate) {
      console.log("startdate =>", parseStartdate);
      console.log("endate =>", parseEnddate);

      // gives us number of days
      var totalDays = (parseEnddate - parseStartdate) / 1000 / 60 / 60 / 24;
      console.log("This is number of days", totalDays);
      // Schedule Job

      // Agenda Job Scheduler
      var connectionString =
        "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true";
      var agenda = new Agenda({
        db: {
          address: connectionString,
          collection: "agenda"
        }
      });

      var connectionString =
        "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true";
      var agenda = new Agenda({
        db: {
          address: connectionString,
          collection: "agenda"
        }
      });

      async function run() {
        await agenda.start();

        /*
                define(jobName, [options], fn)

                Defines a job with the name of jobName. When a job of jobName gets run, 
                it will be passed to fn(job, done). To maintain asynchronous behavior, 
                you must call done() when you are processing the job. If your function is 
                synchronous, you may omit done from the signature.
                 */
        agenda.define("In five seconds", function(job, done) {
          console.log("hello world!");
          done();
        });

        /* 
Schedules a job to run name once at a given time. when can be a Date or a String such as tomorrow at 5pm.
data is an optional argument that will be passed to the processing function under job.attrs.data.
cb is an optional callback function which will be called when the job has been persisted in the database.
Returns the job.
                 */

        agenda.schedule(`in ${totalDays} days`, "Second Test Run", {
          time: new Date(),
          totalInboxCount: response.inboxCount.mohamedInbox,
          totalOutboxCount: response.outboxCount.mohamedOutbox,
          messageAverage: ""
        });

        // using SendGrid's v3 Node.js Library
        // https://github.com/sendgrid/sendgrid-nodejs
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        const msg = {
          to: "mohamedronaldohenry@gmail.com",
          from: "mohamedronaldohenry@gmail.com",
          subject: "Report",
          text: "and easy to do anywhere, even with Node.js",
          html: `For the week of ${parseStartdate} to ${parseEnddate}, You have an Inbox count of : ${
            response.inboxCount.mohamedInbox
          }.
          An Outbox Count of : ${response.outboxCount.mohamedOutbox}.
          and an verage of: My Average`
          // outbox: "response.outboxCount.mohamedOutbox"
        };
        sgMail.send(msg);

        console.log("Wait 5 seconds...");
      }

      run();
    }

    //  // Agenda Job Scheduler
    //  var connectionString = "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true"
    //  var agenda = new Agenda({
    //      db: {
    //          address: connectionString,
    //          collection: 'agenda'
    //      }
    //  });

    //  async function run() {
    //      // start the job
    //      await agenda.start();

    //      // define the job
    //      agenda.define('In five seconds', function (job, done) {
    //          console.log('hello world!');
    //          // must have done since this is async
    //          done();
    //      });
    //      /* will complete job in time specified and will set the name as
    //       whats passed 'Mohamed was here'
    //       */
    //      agenda.schedule('in 5 seconds', 'This is from the post', {
    //          // will have a date field with the time stored in the collection
    //          time: new Date(),
    //          quantity: req.query.quantity,
    //          email: {
    //              inboxCount: inboxCount.mohamedInbox,
    //              outboxCount: outobxCount.mohamedOutbox
    //          }
    //      });
    //      // agenda.start();

    //      console.log('Wait 5 seconds...');

    //  }

    //  run();

    console.log("This is the number of inbox emails", filterInbox.length);
    console.log("This is the number of outbox emails", filterCounts.length);
    return res.send(response);
  } catch (e) {
    console.log(e, "an eror");
  }

  SERA.find({}, function(error, reply) {
    if (!error) {
      // Sends result
      res.send(reply);
      console.log("I am sending the filtered emails");
    } else {
      console.log("There is a problem filtering emails");
    }
  });
});

("===================================================================================================");
/* TestingPost Route for Scheduling Jobs*/
//  router.post("/quantity", async (req, res) => {
//      let parms = {
//          title: "Auto Report",
//          active: {
//              auto: true
//          }
//      };

//      res.send('The quantity is : ' + req.query.quantity);
//      console.log("The quantity is ", req.query.quantity);

//      var connectionString = "mongodb+srv://mohamedali:Moemo124!@sera-outlook-edxbb.mongodb.net/test?retryWrites=true"
//      var agenda = new Agenda({
//          db: {
//              address: connectionString,
//              collection: 'agenda'
//          }
//      });

//      async function run() {
//          // start the job
//          await agenda.start();

//          // define the job
//          agenda.define('In five seconds', function (job, done) {
//              console.log('hello world!');
//              // must have done since this is async
//              done();
//          });
//          /* will complete job in time specified and will set the name as
//           whats passed 'Mohamed was here'
//           */
//          agenda.schedule('in 5 seconds', 'This is from the post', {
//              // will have a date field with the time stored in the collection
//              time: new Date(),
//              quantity: req.query.quantity
//          });
//          // agenda.start();

//          console.log('Wait 5 seconds...');

//      }

//      run();

//      //  const {
//      //      startdate,
//      //      enddate
//      //  } = req.body;
//      //  console.log("========", req.body);
//      //  if (!startdate && !enddate) {
//      //      res.status(400);
//      //      return res.send("Please select start and end dates");
//      //  }
//      //  /*
//      //        Here we query the db and get based on the selected dates
//      //        Uncomment to go back to old way

//      //      */
//      //  try {
//      //      const findDates = await SERA.find()
//      //          .lean()
//      //          .exec();
//      //      const parseStartdate = new Date(startdate);
//      //      const parseEnddate = new Date(enddate);

//      //      // Filters by date range
//      //      const filterDateSelections = findDates.filter(result => {
//      //          const date = new Date(result.receivedDateTime).getTime();
//      //          return date >= parseStartdate.getTime() && date <= parseEnddate.getTime();
//      //      });
//      //      // gets count of outbox messages
//      //      const getConvoCounts = await getTotalResponses();
//      //      // get count of inbox messages
//      //      const getInboxCounts = await getInboxResponses();
//      //      // call inbox logic for counting here
//      //      console.log(getConvoCounts);

//      //      const filterCounts = filterDateSelections.map(ft => {
//      //          return getConvoCounts.conversations.filter(
//      //              gC => gC.conversationId === ft.conversationId
//      //          );
//      //      });

//      //      const filterInbox = filterDateSelections.map(ft => {
//      //          return getInboxCounts.conversations.filter(
//      //              gc => gc.conversationId === ft.conversationId
//      //          );
//      //      });

//      //      const response = {
//      //          data: filterDateSelections,
//      //          outboxCount: {
//      //              filteredCount: filterCounts.length,
//      //              ...getConvoCounts
//      //          },
//      //          data2: filterDateSelections,
//      //          inboxCount: {
//      //              filteredCount: filterInbox.length,
//      //              ...getInboxCounts
//      //          }
//      //      };

//      //      parms.outboxTotal = filterCounts.length;
//      //      parms.inboxTotal = filterInbox.length;
//      //      console.log("This is the number of inbox emails", filterInbox.length);
//      //      console.log("This is the number of outbox emails", filterCounts.length);
//      //      return res.send(response);
//      //  } catch (e) {
//      //      console.log(e, "an eror");
//      //  }

//      //  SERA.find({}, function (error, reply) {
//      //      if (!error) {
//          // Sends result
//          res.send(reply);
//          console.log("I am sending the filtered emails");
//      } else {
//          console.log("There is a problem filtering emails");
//      }
//  });
//});

module.exports = router;
