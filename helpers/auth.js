// This file is where we authenticate the token we get back from the api
const credentials = {
  client: {
    // this is the app_id that we get when we register our app on microsoft
    id: process.env.APP_ID,
    // this is the password. stored in our .env file. Client password
    secret: process.env.APP_PASSWORD,
  },
  auth: {
    //  String used to set the host to request the tokens to. Required.
    tokenHost: 'https://login.microsoftonline.com',
    // String path to request an authorization code
    authorizePath: 'common/oauth2/v2.0/authorize',
    //String path to request an access token. 
    tokenPath: 'common/oauth2/v2.0/token'
  }
};
// here we require simple-oauth2
const oauth2 = require('simple-oauth2').create(credentials);
// require a jsonwebtoken
const jwt = require('jsonwebtoken');

// this function will get the scopes and redirect_uri 
// and authorize it.
function getAuthUrl() {
  const returnVal = oauth2.authorizationCode.authorizeURL({
    // this is where we are redirected after authorization
    redirect_uri: process.env.REDIRECT_URI,
    // this is the scopes of the app
    scope: process.env.APP_SCOPES
  });
  console.log(`Generated auth url: ${returnVal}`);
  return returnVal;
}

// this function gets the token to be authorized
async function getTokenFromCode(auth_code, res) {
  // gets the access token object
  let result = await oauth2.authorizationCode.getToken({
    code: auth_code,
    redirect_uri: process.env.REDIRECT_URI,
    scope: process.env.APP_SCOPES
  });

  // creates the access token
  const token = oauth2.accessToken.create(result);
  console.log('Token created: ', token.token);

  saveValuesToCookie(token, res);

  return token.token.access_token;
}

async function getAccessToken(cookies, res) {
  // Do we have an access token cached?
  let token = cookies.graph_access_token;

  if (token) {
    // We have a token, but is it expired?
    // Expire 5 minutes early to account for clock differences
    const FIVE_MINUTES = 300000;
    const expiration = new Date(parseFloat(cookies.graph_token_expires - FIVE_MINUTES));
    if (expiration > new Date()) {
      // Token is still good, just return it
      return {
        token,
        userName: cookies.graph_user_name
      };
    }
  }

  // Either no token or it's expired, do we have a 
  // refresh token?
  // If we do, create set the refresh_token and then refresh it
  // after that we save it and return it
  const refresh_token = cookies.graph_refresh_token;
  if (refresh_token) {
    const newToken = await oauth2.accessToken.create({
      refresh_token: refresh_token
    }).refresh();
    const user = saveValuesToCookie(newToken, res);
    // you might want to also return the username with the token
    // the reason is because we get the token before the username
    // we get token but username is saved to cookies
    // so we gotta make another request.
    return {
      // postman testing
      token: newToken.token.access_token,
      userName: user.name
    };
  }

  // Nothing in the cookies that helps, return empty
  return null;
}

//JSON Web Token (JWT) is a compact, URL-safe means of representing
// claims to be transferred between two parties.
function saveValuesToCookie(token, res) {
  // Parse the identity token
  const user = jwt.decode(token.token.id_token);
  // Save the access token in a cookie
  res.cookie('graph_access_token', token.token.access_token, {
    maxAge: 3600000,
    httpOnly: true
  });
  // Save the user's name in a cookie
  res.cookie('graph_user_name', user.name, {
    maxAge: 3600000,
    httpOnly: true
  });
  // Save the refresh token in a cookie
  res.cookie('graph_refresh_token', token.token.refresh_token, {
    maxAge: 7200000,
    httpOnly: true
  });
  // Save the token expiration tiem in a cookie
  res.cookie('graph_token_expires', token.token.expires_at.getTime(), {
    maxAge: 3600000,
    httpOnly: true
  });
  return user;
}

// this function will clear the cookies for the graph variables
// When the user signs out, all of the cookies will be cleared.
function clearCookies(res) {
  // Clear cookies
  res.clearCookie('graph_access_token', {
    maxAge: 3600000,
    httpOnly: true
  });
  res.clearCookie('graph_user_name', {
    maxAge: 3600000,
    httpOnly: true
  });
  res.clearCookie('graph_refresh_token', {
    maxAge: 7200000,
    httpOnly: true
  });
  res.clearCookie('graph_token_expires', {
    maxAge: 3600000,
    httpOnly: true
  });
}

exports.getAuthUrl = getAuthUrl;
exports.getTokenFromCode = getTokenFromCode;
exports.getAccessToken = getAccessToken;
exports.clearCookies = clearCookies;