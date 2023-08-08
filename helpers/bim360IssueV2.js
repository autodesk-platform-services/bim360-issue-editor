const axios = require('axios').default;

const base_url = 'https://developer.api.autodesk.com';

const PageSize = 64;


async function listIssuesV2(containerId, three_legged_token,  filter, page){
   
    let opts = {
        headers: {
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
            //     ? filter.dueDate[0].toISOString() + '...' + filter.dueDate[1].toISOString()
            url += '&filter[dueDate]=' + filter.dueDate;
        }
        
        if (filter.createdAt) {
            url += '&filter[createdAt]=' + (Array.isArray(filter.createdAt)
                ? filter.createdAt[0].toISOString() + '...' + filter.createdAt[1].toISOString()
                : filter.createdAt.toISOString());
           
        }
        if (filter.createdBy) {
            url += '&filter[createdBy]=' + filter.createdBy;
        }
       
    }

    let response = await axios.get(url, opts);
    let results = response.data.results;

    while (response.data.pagination && response.data.pagination.nextUrl) {
        url = response.data.pagination.nextUrl;
        response = await axios.get(url, opts);
        results = results.concat(response.data.results);
    }

    return results;

}

async function listIssueTypesV2(containerId, three_legged_token ,includeSubtypes) {
    // TODO: support 'filter', 'include', or 'fields' params

    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };

    let response = await axios.get(`${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-types?limit=${PageSize}${includeSubtypes ? '&include=subtypes' : ''}`, opts);
    let results = response.data.results;
    return results;
}

async function listLocationNodes(containerId, three_legged_token) {
   
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };

       const treeId = 'default';
     
       const url = `${base_url}/bim360/locations/v2/containers/${encodeURIComponent(containerId)}/trees/${encodeURIComponent(treeId)}/nodes`;
       let response = await axios.get(url, opts);
   
       let results = response.data.results;
    
       return results;

   }

async function listIssueRootCauses(containerId, three_legged_token, includeRootCauses) {
    // TODO: support 'filter', 'include', or 'fields' params
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };

    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-root-cause-categories/?limit=${PageSize}${includeRootCauses ? '&include=rootcauses' : ''}`
       
    let response = await axios.get(url, opts);
    let results = response.data.results;
    return results;
}

async function listIssueComments(containerId, issueId, three_legged_token, page) {
   
    // TODO: support 'filter', 'include', or 'fields' params
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues/${encodeURIComponent(issueId)}/comments`

    let response = await axios.get(url, opts);
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
    let response = await axios.get(url, opts);
    let results = response.data.results;
    return results;
}

async function  listIssueAttributeDefinitions(containerId, three_legged_token) {
    // TODO: support 'filter', 'include', or 'fields' params
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    let headers = {
                'Authorization': `Bearer ${three_legged_token}`
            }
    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issue-attribute-definitions?limit=${PageSize}`;

    let response = await axios.get(url, headers);

    let results = response.data.results;
    while (response.data.pagination && response.data.pagination.offset + response.data.pagination.limit < response.data.pagination.totalResults) {
        response = await axios.get(`issues/v2/containers/${encodeURIComponent(containerId)}/issue-attribute-definitions?offset=${response.data.pagination.offset + response.data.pagination.limit}&limit=${PageSize}`, headers);
        results = results.concat(response.results);
    }
    return results;
}

async function listIssueAttributeMappings(containerId, three_legged_token) {
    // TODO: support 'filter', 'include', or 'fields' params
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`
        }
    };
    let headers = {
        'Authorization': `Bearer ${three_legged_token}`
    }
    let response = await axios.get(`issues/v2/containers/${encodeURIComponent(containerId)}/issue-attribute-mappings?limit=${PageSize}`, opts);
    let results = response.data.results;
    while (response.data.pagination && response.data.pagination.offset + response.data.pagination.limit < response.data.pagination.totalResults) {
        response = await axios.get(`issues/v2/containers/${encodeURIComponent(containerId)}/issue-attribute-mappings?offset=${response.data.pagination.offset + response.data.pagination.limit}&limit=${PageSize}`, headers);
        results = results.concat(response.results);
    }
    return results;
}

  async function createIssue(containerId, payload, three_legged_token) {
    // TODO: support 'fields' param
 
    let opts = {
        headers: {
            'Authorization': `Bearer ${three_legged_token}`,
            'Content-Type': 'application/json'
        
        }
    };

  
    let url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues`;
   
    const response = await axios.post(url, payload,opts);

    
    console.log(`creating one issue in container ${containerId}`) 
    return response.data
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
 
  
        let opts = {
            headers: {
                'Authorization': `Bearer ${three_legged_token}`,
                'Content-Type': 'application/json'
               
            }
        };


    const url = `${base_url}/issues/v2/containers/${encodeURIComponent(containerId)}/issues/${encodeURIComponent(issueId)}`;

    const response = await axios.patch(url,payload, opts);


    console.log(`updating one issue in container ${containerId} successful`) 
    return response.data
  }



module.exports = {
    listIssuesV2,
    listIssueTypesV2,
    listIssueRootCauses,
    listLocationNodes,
    listIssueComments,
    listIssueAttachments,
    createIssue,
    updateIssue,
    listIssueAttributeDefinitions,
    listIssueAttributeMappings
};
