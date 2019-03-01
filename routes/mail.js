// Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license. See LICENSE.txt in the project root for license information.
var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');
var graph = require('@microsoft/microsoft-graph-client');

/* GET /mail */
router.get('/', async function (req, res, next) {
  let parms = {
    title: 'Inbox',
    active: {
      inbox: true
    }
  };

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
        .api('/me/mailfolders/inbox/messages')
        .top(10)
        .select('subject,from,receivedDateTime,isRead,sentDateTime')
        // .orderby('receivedDateTime DESC')
        .count(true)
        .get();

      parms.messages = result.value;
      res.render('mail', parms);
    } catch (err) {
      parms.message = 'Error retrieving messages';
      parms.error = {
        status: `${err.code}: ${err.message}`
      };
      parms.debug = JSON.stringify(err.body, null, 2);
      res.render('error', parms);
    }

  } else {
    // Redirect to home
    res.redirect('/');
  }
});

module.exports = router;




// .api("/me/messages?$filter=from/emailaddress/address eq 'hpham.us@gmail.com' ")
// this is to search for a specific person in all of your messages . works fine

//.api("/me/mailfolders/inbox/messages?$filter=from/emailaddress/address eq 'hpham.us@gmail.com'")
// this will check in your inbox for a specific person email address

//.api("/me/messages?$filter=from/emailaddress/address eq '@npm.js.com'")
// this one doesn't work when searching

// .api('/me/mailfolders/inbox/messages?$search= "from:@student.gsu.edu" ')
// here we are now searching all students with @student.gsu.edu