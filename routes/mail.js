var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');
var db = require('../helpers/database')

// Creating report object from report.js
SERA = require('../helpers/report_Schema')

var app = express()

/* GET /mail */
router.get('/', async function (req, res, next) {
  // the parms object values are whats used in our handlebars display
  // for each file
  let parms = {
    title: 'Inbox',
    active: {
      // this will be why the tab is highlighted
      report: true
    },
    saveSuccess: !!req.query.success
  };
  // get token and username from input of email
  const accessToken = await authHelper.getAccessToken(req.cookies, res);
  const userName = req.cookies.graph_user_name;



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




      // the parms.mohamed is what the mail.hbs uses to loop through the 
      // result array and then display it
      parms.mohamed = result.value;

      // The file to display what we get back from the results.value
      res.render('mail', parms);





    } catch (err) {
      console.error(err);
      parms.message = 'Error retrieving messages';
      parms.error = {
        status: `${err.code}: ${err.message}`
      };
      parms.debug = JSON.stringify(err.body, null, 2);
      res.render('error', parms);
    }
    // if we dont have the accessToken and username?
  } else {
    // Redirect to home
    res.redirect('/');
  }
});




// // Posting Email
// router.post('/saveReport', async function (req, res) {


//   debugger;
//   // get token and username from input of email
//   const accessToken = await authHelper.getAccessToken(req.cookies, res);
//   const userName = req.cookies.graph_user_name;

//   if (accessToken && userName) {
//     parms.user = userName;

//     // Initialize Graph client
//     const client = graph.Client.init({
//       authProvider: (done) => {
//         done(null, accessToken);
//       }
//     });

//     try {
//       // Get the 10 newest messages from inbox
//       const result = await client
//         .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu"')
//         //api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq '@student.gsu.edu'")
//         //api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
//         .top(5)
//         .select('subject,from,receivedDateTime,isRead,sentDateTime')
//         // .orderby('receivedDateTime DESC')
//         .count(true)
//         .get();


//       // const report = new SERA({
//       //   _id: result.value[0].id,
//       //   receivedDateTime: result.value[0].receivedDateTime,
//       //   sentDateTime: result.value[1].sentDateTime
//       // });
//       // // save stores into database
//       // report.save().then(result => {
//       //     console.log(result)
//       //   })
//       //   // error checking
//       //   .catch(err => console.log(err))

//       // res.status(201).json({
//       //   message: "Handling post request to /api/report",
//       //   createdReport: report
//       // });


//     } catch (err) {
//       parms.message = 'Error retrieving messages';
//       parms.error = {
//         status: `${err.code}: ${err.message}`
//       };
//       parms.debug = JSON.stringify(err.body, null, 2);
//       res.render('error', parms);
//     }

//     const report = new SERA({
//       _id: result.value[0].id,
//       firstname: result.value[0].receivedDateTime,
//       sentDateTime: result.value[1].sentDateTime
//     });
//     // save stores into database
//     report.save().then(result => {
//         console.log(result);
//       })
//       // error checking
//       .catch(err => console.log(err));

//     res.status(201).json({
//       message: "Handling post request to /api/report",
//       createdReport: report
//     });


//   } else {
//     // Send error if not working
//     res.send.json({
//       error: "This post is not working. "
//     });
//   }

//   console.log("I have been hit")
// });







module.exports = router;


// .api("/me/messages?$filter=from/emailaddress/address eq 'hpham.us@gmail.com' ")
// this is to search for a specific person in all of your messages . works fine

//.api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq 'hpham.us@gmail.com'")
// this will check in your inbox for a specific person email address

//.api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
// this one doesn't work when searching

// .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu" ')
// here we are now searching all students with @student.gsu.edu