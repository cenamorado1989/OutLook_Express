 var express = require('express');
 var router = express.Router();
 const sgMail = require('@sendgrid/mail');
 var authHelper = require('../helpers/auth');


 // using SendGrid's v3 Node.js Library
 // https://github.com/sendgrid/sendgrid-nodejs

 router.get('/', async function (req, res) {

     let parms = {
         title: 'Schedule',
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

     /* 
     anytime the route is hit we automatically send an email
     Now we want is that when the user clicks the button and selects the date,
     we query the databse for those dates and then send to the logged in users email.
     We also do a toast message saying the message was generated    
     */

     // how to get dates selected



     //      sgMail.setApiKey('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');
     //      const msg = {
     //          to: 'mohamedronaldohenry@gmail.com',
     //          from: 'mali30@student.gsu.edu',
     //          subject: 'Sending with SendGrid is Fun',
     //          text: 'and easy to do anywhere, even with Node.js',
     //          html: '<strong>and easy to do anywhere, even with Node.js</strong>',
     //      };
     //      sgMail.send(msg, function (err) {
     //          if (err)
     //              console.log("You have a problem: " + err);
     //          else
     //              console.log("No Problems sending a message")

     //      });

     res.render('autoreports', parms);

 })


 module.exports = router;