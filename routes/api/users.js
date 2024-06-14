const express = require('express');
const { AuthenticationClient, BIM360Client } = require('forge-server-utils');
const config = require('../../config');
const axios = require('axios').default;
const { authRefreshMiddleware } = require('../../services/aps');

let authClient = new AuthenticationClient(config.client_id, config.client_secret);
let router = express.Router();

function handleError(err, res) {
    console.error(err);
    if (err.isAxiosError) {
        const json = { message: err.message };
        if (err.response.data) {
            json.response = err.response.data;
        }
        res.status(err.response.status).json(json);
    } else {
        res.status(400).json(err);
    }
}

// Parse JSON body
router.use(express.json());

// Refresh token whenever needed
router.use('/', async function (req, res, next) {
    if (req.session.access_token) {
      try{
        await authRefreshMiddleware(req)
    
      }catch (err) {
        res.render('error', { session: req.session, error: err });
        return;
      }
       req.bim360 = new BIM360Client({ token: req.session.access_token }, undefined, req.query.region);
        
    }
    next();
});

// GET /api/users/:project_id
router.get('/:project_id', async function (req, res) {
    const { project_id } = req.params;
    const token = req.bim360.token;
    try {
        const users = await loadProjectUsers(project_id, token);
        res.json(users);
    } catch(err) {
        handleError(err, res);
    }
});

async function loadProjectUsers(projectId, token) {
    // const auth = await authClient.authenticate(['account:read']);
    const PageSize = 64;
    let url = `https://developer.api.autodesk.com/bim360/admin/v1/projects/${projectId}/users?limit=${PageSize}`;
    let opts = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
    let response = await axios.get(url, opts);
    let results = response.data.results;
    while (response.data.pagination && response.data.pagination.nextUrl) {
        url = response.data.pagination.nextUrl;
        response = await axios.get(url, opts);
        results = results.concat(response.data.results);
    }
    return results;
}

module.exports = router;
