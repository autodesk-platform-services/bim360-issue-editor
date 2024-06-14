const express = require('express');
const { AuthenticationClient, BIM360Client } = require('forge-server-utils');
const config = require('../../config');
const { authRefreshMiddleware } = require('../../services/aps');
const axios = require('axios').default;

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

// GET /api/docs/:project/:item
router.get('/:project/:item', async function (req, res) {
    const { project, item } = req.params;
    const token = req.bim360.token;

    try {
        const details = await getItemDetails(project, item, token);
        res.json(details);
    } catch(err) {
        handleError(err, res);
    }
});


async function getItemDetails(projectId, itemId, token ){
  
    let url = `https://developer.api.autodesk.com/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}`;

    let opts = {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };

    // let response = await this.get(`data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}`, headers, ReadTokenScopes);
    let resp = await axios.get(url, opts);
    let response= resp.data;

    if (response.included && response.included.length > 0) {
        const included = response.included[0];

        return Object.assign(response.data.attributes, {
            id: response.data.id,
            type: response.data.type,
            folder: response.data.relationships?.parent?.data?.id,
            derivative: included?.relationships?.derivatives?.data?.id,
            storage: included?.relationships?.storage?.data?.id,
            versionNumber: included?.attributes?.versionNumber
        });
    } else {
        return Object.assign(response.data.attributes, {
            id: response.data.id,
            type: response.data.type,
            folder: response.data.relationships?.parent?.data?.id
         });
    }
}

module.exports = router;
