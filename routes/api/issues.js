const fs = require('fs');
const os = require('os');
const path = require('path');
const spawn = require('child_process').spawn;
const express = require('express');
const { AuthenticationClient, BIM360Client } = require('forge-server-utils');
const multer = require('multer');
const mail = require('@sendgrid/mail');
const upload = multer({ dest: 'uploads/' });
var AdmZip = require("adm-zip");
var http = require("http");
// var stream = require("stream");

const config = require('../../config');
const { exportIssues, importIssues } = require('../../helpers/excel');

const bim360V2 = require('../../helpers/bim360IssueV2');
const bim360OssV2 = require('../../helpers/bim360OssV2');

const { authRefreshMiddleware } = require('../../services/aps');
const { getUserProfile } = require('../../services/aps');
const base_url = 'https://developer.api.autodesk.com';




mail.setApiKey(config.sendgrid_key);
let authClient = new AuthenticationClient(config.client_id, config.client_secret);
let router = express.Router();

function handleError(err, res) {
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



router.get('/:issue_container', async function (req, res) {
    

    const { issue_container } = req.params;
    const  token  = req.session.access_token
    try {
        let filter = {};
        if (req.query.displayId) {
            filter.displayId = req.query.displayId;
        }
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.ownerId) {
            filter.ownerId = req.query.ownerId;
        }
        if (req.query.issueTypeId) {
            filter.issueTypeId = req.query.issueTypeId;
        }
        if (req.query.issueSubtypeId) {
            filter.issueSubtypeId = req.query.issueSubtypeId;
        }
        if (req.query.rootCauseId) {
            filter.rootCauseId = req.query.rootCauseId;
        }
        if (req.query.locationId) {
            filter.locationId = req.query.locationId;
        }
        if (req.query.qualityUrns) {
            filter.qualityUrns = req.query.qualityUrns;
        }
        if (req.query.linkedDocumentUrn) {
            filter.linkedDocumentUrn = req.query.linkedDocumentUrn;
        }
        if (req.query.dueDate) {
            filter.dueDate = req.query.dueDate;

        }
        
        if (req.query.createdAt) {
            filter.createdAt = req.query.createdAt;
        }
        if (req.query.createdBy) {
            filter.createdBy = req.query.createdBy;
        }
       
        let page = null;
        if (req.query.offset || req.query.limit) {
            page = {
                limit: parseInt(req.query.limit) || 64,
                offset: parseInt(req.query.offset) || 0
            };
        }
       
       
        const issues = await bim360V2.listIssuesV2(issue_container, token, filter, page);


        res.json(issues);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/export
router.get('/:issue_container/export', async function (req, res) {

    const { issue_container } = req.params;
    const { hub_id, region, location_container_id, project_id, offset, limit } = req.query;
    try {
        const excel = await exportIssues({
            three_legged_token: req.session.access_token,
            region: region,
            hub_id: hub_id,
            issue_container_id: issue_container,
            location_container_id: location_container_id,
            project_id: project_id,
            page_offset: offset,
            page_limit: limit
        });
        res.type('.xlsx').send(excel);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/export-email
router.get('/:issue_container/export-email', async function (req, res) {
    const { issue_container } = req.params;
    const { hub_id, region, location_container_id, project_id } = req.query;
    const { user_email } = req.session;

    try {
        if (user_email) {
            exportIssues({
                three_legged_token: req.session.access_token,
                region: region,
                hub_id: hub_id,
                issue_container_id: issue_container,
                location_container_id: location_container_id,
                project_id: project_id
            }).then(excel => {
                const msg = {
                    to: user_email,
                    from: 'petr.broz@autodesk.com',
                    subject: 'Exported BIM360 Issues',
                    text: 'Attached you will find the BIM360 issues exported from http://bim360-issue-editor.herokuapp.com.' ,
                    attachments: [
                        {
                            content: excel.toString('base64'),
                            filename: 'issues.xlsx',
                            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            disposition: 'attachment'
                        }
                    ]
                };
                return mail.send(msg);
            }).then(resp => {
            }).catch(err => {
                throw err;
            });
            res.render('message', { session: req.session, message: `Issues will be exported and emailed to ${user_email}.` });
        } else {
            res.render('error', { session: req.session, error: `E-mail address not available or not verified.` });
        }
    } catch (err) {
        handleError(err, res);
    }
});

// POST /api/issues/:issue_container/import
router.post('/:issue_container/import', upload.single('xlsx'), async function (req, res) {
    const { issue_container } = req.params;
    const xlsx = fs.readFileSync(req.file.path);
    try {
        const results = await importIssues(xlsx, issue_container, req.session.access_token);
        res.json(results);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/config.json.zip
// Returns password-protected archive with configuration for the command-line tools available in this project.
router.get('/:issue_container/config.json.zip', async function (req, res) {
    const { issue_container } = req.params;
    const { hub_id, region, location_container_id, project_id } = req.query;
    try {
        // Get a fresh 2-legged token as well
        const twoLeggedToken = await authClient.authenticate(['data:read', 'data:write', 'data:create', 'account:read']);
        // Refresh the 3-legged token to make sure the user gets one "as fresh as possible"
     
        authRefreshMiddleware(req)

    
        // Pack everything into a password-protected zip
        const cfg = JSON.stringify({
            created_at: new Date().toISOString(),
            expires_at: new Date(req.session.expires_at).toISOString(),
            two_legged_token: twoLeggedToken.access_token,
            three_legged_token: req.session.access_token,
            region: region,
            hub_id: hub_id,
            issue_container_id: issue_container,
            location_container_id: location_container_id,
            project_id: project_id
        }, null, 4);

        const tmpDir = path.resolve(os.tmpdir(), issue_container);
        const jsonPath = path.join(tmpDir, 'config.json');
        const zipPath = path.join(tmpDir, 'config.zip');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir);
        }
        fs.writeFileSync(jsonPath, cfg);

        //creating archives
        var zip = new AdmZip();
       
        // add local file
        zip.addLocalFile(jsonPath);
        
        // or write everything to disk
        zip.writeZip(zipPath);

        if (!fs.existsSync(zipPath)) {
            console.log("Could not compress the file.")
                return;
        }
        //check if the ALLOW_CONFIG_DOWNLOAD is set to true
        var check =  process.env.ALLOW_CONFIG_DOWNLOAD.toLowerCase()
        if(check !== "true"){
            res.render('error', { session: req.session, error: `You do not have permissions to download the config file. Kindly, set the environment variable: ALLOW_CONFIG_DOWNLOAD to TRUE` });
            return;
        } else{
            res.sendFile(zipPath, function (err) {
                if (err) {
                    handleError(err, res);
                }
                fs.unlinkSync(jsonPath);
                fs.unlinkSync(zipPath);
            });
        }
        
        }
 catch (err) {
        handleError(err, res);
    }
});
       

// GET /api/issues/:issue_container/root-causes
router.get('/:issue_container/root-causes', async function (req, res) {
    const { issue_container } = req.params;
    const token = req.bim360.token;

    try {
         const rootCauses = await bim360V2.listIssueRootCauses(issue_container, token, true);

        res.json(rootCauses);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/issue-types
router.get('/:issue_container/issue-types', async function (req, res) {
    const { issue_container } = req.params;
    const token = req.bim360.token;
    try {
        const issueTypes = await bim360V2.listIssueTypesV2(issue_container, token,true);

        res.json(issueTypes);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/attr-definitions
router.get('/:issue_container/attr-definitions', async function (req, res) {
    const { issue_container } = req.params;
    const token = req.bim360.token;
    try {
        const attrDefinitions = await bim360V2.listIssueAttributeDefinitions(issue_container, token);

        res.json(attrDefinitions);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/attr-mappings
router.get('/:issue_container/attr-mappings', async function (req, res) {
    const { issue_container } = req.params;
    const token = req.bim360.token;
    try {
        const attrMappings = await bim360V2.listIssueAttributeMappings(issue_container, token);

        res.json(attrMappings);
    } catch (err) {
        handleError(err, res);
    }
});

// PATCH /api/issues/:issue_container/:issue
router.patch('/:issue_container/:issue', async function (req, res) {
    const { issue_container, issue } = req.params;
    const token = req.bim360.token;
    const payload = req.body;

    if(payload.locationId == ''){
        delete payload.locationId
    }

    try {
        
        const updatedIssue = await bim360V2.updateIssue(issue_container, issue, JSON.stringify(payload), token);

        res.json(updatedIssue);
    } catch (err) {
        handleError(err, res);
    }
});


// GET /api/issues/:issue_container/:issue/comments
router.get('/:issue_container/:issue/comments', async function (req, res) {
    const { issue_container, issue } = req.params;
    const token = req.bim360.token;
    try {
        const comments = await bim360V2.listIssueComments(issue_container, issue, token);
        res.json(comments);
    } catch (err) {
        handleError(err, res);
    }
});

// GET /api/issues/:issue_container/:issue/attachments
router.get('/:issue_container/:issue/attachments', async function (req, res) {
    const { issue_container, issue } = req.params;
    const token = req.bim360.token;
    try {
        const attachments = await bim360V2.listIssueAttachments(issue_container, issue, token);
        
        res.json(attachments);
    } catch (err) {
        handleError(err, res);
    }
});


router.get('/:issue_container/:issue/attachments/:id', async function (req, res) {
    const { issue_container, issue, id } = req.params;
    const token = req.bim360.token;

    try {
        const attachments = await bim360V2.listIssueAttachments(issue_container, issue, token);


        const match = attachments.find(attachment => attachment.id === id);
        if (match) {
            let urn = match.urn;
            if(!urn.includes("/")){
               let folderId = match.wipUrn;

                let webUrl =  `https://docs.b360.autodesk.com/projects/${encodeURIComponent(issue_container)}/folders/${folderId}/detail/viewer/items/${urn}`

                res.writeHead(301, { Location:  webUrl });
                return res.end();


              }else{
                const buffer = await bim360OssV2.downloadAttachment(urn, token);
            
                buffer.pipe(res);
              }

        } else {
            console.log("Error while previewing the file")
           return res.status(404).end();
        }
    } catch (err) {
        handleError(err, res);
    }
});

module.exports = router;
