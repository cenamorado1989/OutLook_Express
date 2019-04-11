 var express = require('express');
 var router = express.Router();
 var authHelper = require('../helpers/auth');




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


     res.render('autoreports', parms);

 })


 module.exports = router;