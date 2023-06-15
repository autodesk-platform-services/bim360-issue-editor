const express = require('express');
const { AuthenticationClient } = require('forge-server-utils');
const config = require('../config');
const bim360V2 = require('./../helpers/bim360V2');

let authClient = new AuthenticationClient(config.client_id, config.client_secret);
let router = express.Router();

// GET /auth/login
router.get('/login', function (req, res) {
    const url = authClient.getAuthorizeRedirect(config.scopes, config.redirect_uri);
    res.redirect(url);
});

// GET /auth/callback
router.get('/callback', async function (req, res) {
    try {
        const token = await authClient.getToken(req.query.code, config.redirect_uri);
        req.session.access_token = token.access_token;
        req.session.refresh_token = token.refresh_token;
        req.session.expires_at = Date.now() + token.expires_in * 1000;
        // const profile = await authClient.getUserProfile(req.session.access_token);
        const profile = await bim360V2.getUserProfile(req.session.access_token);

        req.session.user_name = profile.name;
        // req.session.user_email = profile.email_verified ? profile.email : '';
        req.session.user_email = profile.email;

        res.redirect('/');
    } catch(err) {
        res.status(400).json(err);
    }
});

// GET /auth/logout
router.get('/logout', function (req, res) {
    delete req.session.access_token;
    delete req.session.refresh_token;
    delete req.session.expires_at;
    delete req.session.user_name;
    delete req.session.user_email;
    res.redirect('/');
});

module.exports = router;
