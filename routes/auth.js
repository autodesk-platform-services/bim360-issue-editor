const express = require('express');
const { getAuthorizationUrl, authCallbackMiddleware, authRefreshMiddleware, getUserProfile } = require('../services/aps.js');



let router = express.Router();

router.get('/login', function (req, res) {
    const url = getAuthorizationUrl();

    res.redirect(url);
});

router.get('/logout', function (req, res) {
    req.session = null;
    res.redirect('/');
});

router.get('/callback', authCallbackMiddleware, function (req, res) {
    try {
    res.redirect('/');
} catch (err) {
    next(err);
  }

});


router.get('/api/auth/token', authRefreshMiddleware, function (req, res) {
    res.json(req.publicOAuthToken);
});

router.get('/api/auth/profile', authRefreshMiddleware, async function (req, res, next) {
    try {
        const profile = await getUserProfile(req.internalOAuthToken);
        console.log("usser dets", profile)
       
        res.json({ name: `${profile.firstName} ${profile.lastName}` });
    } catch (err) {
        next(err);
    }
});

module.exports = router;