const http = require('http');
const axios = require('axios').default;
const config = require('./../config');  
const fs = require('fs');
const path = require('path');
const { ok } = require('assert');

const base_url = 'https://developer.api.autodesk.com';

const ReadTokenScopes = ['data:read', 'account:read'];
const WriteTokenScopes = ['data:create', 'data:write', 'data:read'];
const PageSize = 64;


async function listIssuesV2(containerId, three_legged_token,  filter, page){
   
    const headers = { 'Content-Type': 'application/vnd.api+json' };
    let opts = {
        headers: {
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
   
    let url = page
            ? `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues?limit=${page.limit}&offset=${page.offset}`

            : `${base_url}issues/v2/containers/${encodeURIComponent(containerId)}/issues?limit=${PageSize}`;

    if (filter) {
      
        if (filter.displayId) {
            url += '&filter[displayId]=' + filter.displayId;
        }
        if (filter.status) {
            url += '&filter[status]=' + filter.status;
        }
        if (filter.ownerId) {
            url += '&filter[ownerId]=' + filter.ownerId;
        }
        if (filter.issueTypeId) {
            url += '&filter[issueTypeId]=' + filter.issueTypeId;
        }
        if (filter.issueSubtypeId) {
            url += '&filter[issueSubtypeId]=' + filter.issueSubtypeId;
        }
        if (filter.rootCauseId) {
            url += '&filter[rootCauseId]=' + filter.rootCauseId;
        }
        if (filter.locationId) {
            url += '&filter[locationId]=' + filter.locationId;
        }
        if (filter.qualityUrns) {
            url += '&filter[qualityUrns]=' + filter.qualityUrns;
        }
        if (filter.linkedDocumentUrn) {
            url += '&filter[linkedDocumentUrn]=' + filter.linkedDocumentUrn;
        }
        if (filter.dueDate) {
            // url += '&filter[dueDate]=' + (Array.isArray(filter.dueDate)
            //     ? filter.dueDate[0].toISOString() + '...' + filter.dueDate[1].toISOString()
            //     : filter.dueDate.toISOString());
            url += '&filter[dueDate]=' + filter.dueDate;
        }
        // if (filter.synced_after) {
        //     url += '&filter[synced_after]=' + filter.synced_after.toISOString();
        // }
        if (filter.createdAt) {
            url += '&filter[createdAt]=' + (Array.isArray(filter.createdAt)
                ? filter.createdAt[0].toISOString() + '...' + filter.createdAt[1].toISOString()
                : filter.createdAt.toISOString());
           
        }
        if (filter.createdBy) {
            url += '&filter[createdBy]=' + filter.createdBy;
        }
       
    }

    let response = await axios.get(url, opts, ReadTokenScopes);
    let results = response.data.results;

    while (response.data.pagination && response.data.pagination.nextUrl) {
        url = response.data.pagination.nextUrl;
        response = await axios.get(url, opts, ReadTokenScopes);
        results = results.concat(response.data.results);
    }


    
    return results;

    
    
}


async function listIssueTypesV2(containerId, three_legged_token ,includeSubtypes) {
    // TODO: support 'filter', 'include', or 'fields' params

    let opts = {
        headers: {
            'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };


//     
    let response = await axios.get(`${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-types?limit=${PageSize}${includeSubtypes ? '&include=subtypes' : ''}`, opts, ReadTokenScopes);
    // let results = response.results;
    let results = response.data.results;
    while (response.pagination && response.pagination.offset + response.pagination.limit < response.pagination.totalResults) {
        response = await axios.get(`${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-types?offset=${response.pagination.offset + response.pagination.limit}&limit=${PageSize}${includeSubtypes ? '&include=subtypes' : ''}`, opts, ReadTokenScopes);
        results = results.concat(response.data.results);
    }
    return results;
}

async function listLocationNodes(containerId, three_legged_token) {
   
    let opts = {
        headers: {
            // 'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };

       const treeId = 'default';
     
       const url = `${base_url}/bim360/locations/v2/containers/${encodeURIComponent(containerId)}/trees/${encodeURIComponent(treeId)}/nodes`;
       let response = await axios.get(url, opts, ReadTokenScopes);
   
       let results = response.data.results;
    //    console.log("all loacations, results", results)
    
       return results;

   }

async function listIssueRootCauses(containerId, three_legged_token, includeRootCauses) {
    // TODO: support 'filter', 'include', or 'fields' params
   const pagesize = 20;
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };

    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-root-cause-categories/?limit=${PageSize}${includeRootCauses ? '&include=rootcauses' : ''}`
       
    let response = await axios.get(url, opts, ReadTokenScopes);
    let results = response.data.results;
    return results;
}

async function listIssueComments(containerId, issueId, three_legged_token, page) {
   
    const PageSize = 64;
    // TODO: support 'filter', 'include', or 'fields' params
    const headers = { 'Content-Type': 'application/vnd.api+json' };
    let opts = {
        headers: {
            // 'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues/${encodeURIComponent(issueId)}/comments`

    let response = await axios.get(url, opts, ReadTokenScopes);
    let results = response.data.results;

   
    
    return results;
}

async function listIssueAttachments(containerId, issueId, three_legged_token) {
    // TODO: support 'filter', 'include', or 'fields' params
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues/${encodeURIComponent(issueId)}/attachments`;
    let response = await axios.get(url, opts, ReadTokenScopes);
    let results = response.data.results;
    return results;
}

async function signeds3download(bucketKey, objectKey,  three_legged_token, name){
    let opts = {
        headers: {
            // 'Content-Type': 'application/vnd.api+json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    const url = `${base_url}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3download`;
    let response = await axios.get(url, opts, ReadTokenScopes);
    let results = response.data;

    console.log("my s3 downloda URL", results)
    return results;
   
}
async function getBinary(endpoint, headers) {
    const options = { headers };
    const response = await fetch(endpoint, options);
    if (response.status == 200) { 
        return response.body
    } else {
        const message = await response.text(); 
        throw new Error(response.status+ ' ' + response.statusText + ' ' + message);
    }
}
async function downloadAttachment(urn,name, token) {
    try { 
       
      //extract bucket key and object key of oss object
      var split_by_splash = urn.split("/") 
      var split_by_colon = split_by_splash[0].split(":")
      const attachment_object_key = split_by_splash[1]
      const attachment_bucket_key = split_by_colon[3] 
  
      //Generate a signed S3 URL
      const res = await getS3SignedDownloadUrl(attachment_bucket_key,attachment_object_key, token)
      const s3_download_url = res.data.url 
      const rootDir = process.cwd();
      const file_full_path_name = path.join(rootDir,'Files', name) 

    //   const fileStream = fs.WriteStream(file_full_path_name);
      const fileStream = fs.CreateWriteStream(file_full_path_name);


      const body = await getBinary(s3_download_url) 
  
      await new Promise((resolve, reject) => {
        // body.pipe(fileStream);
        // body.on("error", reject);
        // fileStream.from(body)
        fileStream.write(body);
        fileStream.on("error", reject);

        fileStream.on("finish", resolve);
        console.log('Attachment File Saved.')  
      });
  
      return file_full_path_name 
  
    }catch (e) {
      console.error(`download attachment for urn = ${urn} failed: ${e}`)
      return null
    }
  }

  async function getS3SignedDownloadUrl(bucketKey,objectKey,three_legged_token) {
    try {
       
        let opts = {
            headers: {
                // 'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${three_legged_token}`
            }
        };
        
    const endpoint = `${base_url}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3download`;

  
     
      const response = await axios.get(endpoint, opts);
  
      if (response) {
        console.log(`getS3SignedDownloadUrl...` )
        return response 
      } else {
        return null
      }
    } catch (e) {
      console.error(`getS3SignedDownloadUrl failed: ${e}`)
      return null
    }
  }

  async function createIssue(containerId, payload, three_legged_token) {
    // TODO: support 'fields' param
    try {

    let opts = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
  
    let url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}issues`;
   
    const response = await axios.post(url, payload,opts, WriteTokenScopes);

    
    console.log(`creating one issue in container ${containerId}`) 
    return response.data
  } catch (e) {
    console.error(`creating one issue in container ${containerId} failed: ${e}`)
    return null
  }
}
/**
 * Updates existing BIM360 issue.
 * Requires 3-legged token.
 * {@link https://forge.autodesk.com/en/docs/bim360/v1/reference/http/field-issues-:id-PATCH}.
 * @async
 * @param {string} containerId ID of container storing all issues for a specific projects.
 * @param {string} issueId ID of updated issue.
 * @param {IUpdateIssue} attributes Issue attributes to update.
 * @returns {Promise<IIssue>} Updated issue details.
 */
async function updateIssue(containerId, issueId, payload, three_legged_token ) {
    try{

    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`,
            'Content-Type': 'application/json',
        }
    };

    const headers = { 'Content-Type': 'application/vnd.api+json',
    'Authorization': `Bearer ${three_legged_token}`
 };


    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues/${encodeURIComponent(issueId)}`;

    const response = await axios.patch(url,payload, opts , WriteTokenScopes);

    console.log(`updating one issue in container ${containerId} successful`) 
    return response.data 
  } catch (e) {
    console.error(`updating one issue in container ${containerId} failed: ${e}`)
    return null
  }

// const headers = { 'Content-Type': 'application/vnd.api+json' };
// const params = {
//     data: {
//         type: 'quality_issues',
//         id: issueId,
//         attributes
//     }
// };
// const response = await this.patch(`issues/v1/containers/${encodeURIComponent(containerId)}/quality-issues/${encodeURIComponent(issueId)}`, params, headers, WriteTokenScopes);
// return Object.assign(response.data.attributes, { id: response.data.id });
}

async function patch(endpoint, headers, body) {
    const options = { method: 'PATCH', headers: headers || {}, body: body };
    const response = await fetch(endpoint, options);
    if (response.status == 200) {
        const json = await response.json();
        return json;
    } else {
        const message = await response.text();
        throw new Error(response.status+ ' ' + response.statusText + ' ' + message);
    }
}


module.exports = {
    listIssuesV2,
    listIssueTypesV2,
    listIssueRootCauses,
    listLocationNodes,
    listIssueComments,
    listIssueAttachments,
    signeds3download,
    getBinary,
    downloadAttachment,
    createIssue,
    updateIssue,
    // patch
};
