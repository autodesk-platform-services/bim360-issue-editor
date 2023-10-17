const APS = require('forge-apis');
const axios = require('axios').default;
const { client_id, client_secret, callback_url, scopes, PUBLIC_TOKEN_SCOPES } = require('../config.js');
const internalAuthClient = new APS.AuthClientThreeLegged(client_id, client_secret, callback_url, scopes);

const publicAuthClient = new APS.AuthClientThreeLegged(client_id, client_secret, callback_url, PUBLIC_TOKEN_SCOPES);

const service = module.exports = {};

service.getAuthorizationUrl = () => internalAuthClient.generateAuthUrl();

service.authCallbackMiddleware = async (req, res, next) => {
    
    const internalCredentials = await internalAuthClient.getToken(req.query.code);
    const publicCredentials = await publicAuthClient.refreshToken(internalCredentials);
    req.session.public_token = publicCredentials.access_token;
    req.session.access_token = internalCredentials.access_token;
    req.session.refresh_token = publicCredentials.refresh_token;
    req.session.expires_at = Date.now() + internalCredentials.expires_in * 1000;
    const profile = await service.getUserProfile(req.session.access_token)
    req.session.user_name = profile.name
    req.session.user_email =  profile.email;


    next();

};

service.authRefreshMiddleware = async (req, res, next) => {
    let { refresh_token, expires_at } = req.session;
    if (!refresh_token) {
        res.status(401).end();
        return;
    }
    if (expires_at < Date.now()) {
        const internalCredentials = await internalAuthClient.refreshToken({ refresh_token });
        const publicCredentials = await publicAuthClient.refreshToken(internalCredentials);
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
    const resp = await axios.get('https://api.userprofile.autodesk.com/userinfo', config);

    return resp.data;
};
service.getHubs = async (token) => {
    const resp = await new APS.HubsApi().getHubs(null, internalAuthClient, token);
    return resp.body.data;
};
