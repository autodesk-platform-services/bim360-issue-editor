const APS = require('forge-apis');


const { AuthenticationClient, ResponseType, Scopes, TokenTypeHint  } = require('@aps_sdk/authentication');

const { ApiResponse, SDKManager, SdkManagerBuilder  } = require ('@aps_sdk/autodesk-sdkmanager');

const axios = require('axios').default;

const { client_id, client_secret, callback_url, scopes, PUBLIC_TOKEN_SCOPES } = require('../config.js');


const internalAuthClient = new APS.AuthClientThreeLegged(client_id, client_secret, callback_url, scopes);
// const publicAuthClient = new APS.AuthClientThreeLegged(client_id, client_secret, callback_url, PUBLIC_TOKEN_SCOPES);

const sdkmanager = SdkManagerBuilder.Create().build();
const authenticationClient = new AuthenticationClient(sdkmanager);


// const authClient = new AuthenticationClient(SDKManager);



const service = module.exports = {};

// service.getAuthorizationUrl = () => internalAuthClient.generateAuthUrl();

service.getAuthorizationUrl = () => authenticationClient.authorize(client_id, ResponseType.Code, callback_url, scopes);

service.getLogoutUrl = () => authenticationClient.Logout("www.google.com");


service.authCallbackMiddleware = async (req, res, next) => {
    
    const internalCredentials = await authenticationClient.getThreeLeggedTokenAsync(client_id, client_secret, req.query.code, callback_url);

    // const publicCredentials = await authenticationClient.getThreeLeggedTokenAsync(client_id, client_secret, req.query.code, callback_url);
    //How to generate token for public clients
    const publicCredentials = internalCredentials;

    req.session.access_token = internalCredentials.access_token;
    req.session.public_token = publicCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    const userInfo = await authenticationClient.getUserinfoAsync(req.session.access_token);
    // console.log('user-info', userInfo)
    req.session.user_name = userInfo.name
    req.session.user_email =  userInfo.email;


    next();

};

service.authRefreshMiddleware = async (req, res, next) => {
    let { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }
    if (expires_at < Date.now()) {
        // const internalCredentials = await internalAuthClient.refreshToken({ refresh_token });

        const internalCredentials = await authenticationClient.getRefreshTokenAsync(client_id, client_secret, refresh_token);
//How to refresh token for public clients
        // const publicCredentials = await publicAuthClient.refreshToken(internalCredentials);
        const publicCredentials = internalCredentials

        req.session.public_token = publicCredentials.access_token;
        req.session.access_token = internalCredentials.access_token;
        req.session.refresh_token = publicCredentials.refresh_token;
        req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    }
    req.internalOAuthToken = {
        access_token: req.session.access_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    req.publicOAuthToken = {
        access_token: req.session.public_token,
        expires_in: Math.round((req.session.expires_at - Date.now()) / 1000)
    };
    // next();
};

service.getUserProfile = async (token) => {
   
    const config = {
        headers: {
            'Authorization': 'Bearer ' + token
        }
    };
    const userInfo = await authenticationClient.getUserinfoAsync(access_token);

    return userInfo;
};
service.getHubs = async (token) => {
    const resp = await new APS.HubsApi().getHubs(null, internalAuthClient, token);
    return resp.body.data;
};
