var express = require('express');
var router = express.Router();
var authHelper = require('../helpers/auth');

/* GET home page. */
router.get('/', async function (req, res, next) {
  let parms = {
    // document this 
    title: 'Home',
    active: {
      home: true
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
    
    parms.debug = `User: ${userName}\nAccess Token: ${accessToken}`;
  } else {
    // we get the authorization url if we dont have the accessToken username
    // on the index.hbs this will be the link to the micorosft outlook sign in page
    parms.signInUrl = authHelper.getAuthUrl();
    // 
    parms.debug = parms.signInUrl;
  }

  // render on the index page
  res.render('index', parms);
});

module.exports = router;