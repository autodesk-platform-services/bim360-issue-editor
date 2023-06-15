const { BIM360Client } = require('forge-server-utils');
const axios = require('axios').default;
const ExcelJS = require('exceljs');
<<<<<<< HEAD
const bim360V2 = require('./bim360V2');
=======
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032

/**
 * Exports BIM360 issues and related data into XLSX spreadsheet.
 * @async
 * @param {object} opts Export options.
 * @param {string} opts.two_legged_token 2-legged access token for APS requests requiring app context.
 * @param {string} opts.three_legged_token 3-legged access token for APS requests requiring user context.
 * @param {string} opts.region APS region ("US" or "EMEA").
 * @param {string} opts.hub_id BIM360 hub ID.
 * @param {string} opts.project_id BIM360 project ID.
 * @param {string} opts.issue_container_id BIM360 issues container ID.
 * @param {string} opts.location_container_id BIM360 locations container ID.
 * @param {number} [opts.page_offset] Offset of the issue page to export.
 * @param {number} [opts.page_limit] Length of the issue page to export.
 * @returns {Promise<Buffer>} XLSX spreadsheet serialized into buffer.
 */
async function exportIssues(opts) {
    const {
        two_legged_token,
        three_legged_token,
        region,
        hub_id,
        project_id,
        issue_container_id,
        location_container_id,
        page_offset,
        page_limit
    } = opts;
<<<<<<< HEAD
    // const appContextBIM360 = new BIM360Client({ token: two_legged_token }, undefined, region);
    const userContextBIM360 = new BIM360Client({ token: three_legged_token }, undefined, region);
       
    const [issues, types, users, locations, documents] = await Promise.all([
        loadIssues(three_legged_token, issue_container_id, page_offset, page_limit),
        loadIssueTypes(three_legged_token, issue_container_id),
        loadUsers(project_id, two_legged_token),
        loadLocations(three_legged_token, location_container_id),
=======
    const appContextBIM360 = new BIM360Client({ token: two_legged_token }, undefined, region);
    const userContextBIM360 = new BIM360Client({ token: three_legged_token }, undefined, region);

    console.log('Fetching BIM360 data for export.');
    const [issues, types, users, locations, documents] = await Promise.all([
        loadIssues(userContextBIM360, issue_container_id, page_offset, page_limit),
        loadIssueTypes(userContextBIM360, issue_container_id),
        loadUsers(project_id, two_legged_token),
        loadLocations(userContextBIM360, location_container_id),
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
        loadDocuments(userContextBIM360, hub_id, project_id)
    ]);
    console.log('Generating XLSX spreadsheet.');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'bim360-issue-editor';
    fillIssues(workbook.addWorksheet('Issues'), issues, types, users, locations, documents);
    fillIssueTypes(workbook.addWorksheet('Types'), types);
    fillIssueOwners(workbook.addWorksheet('Owners'), users);
    fillIssueLocations(workbook.addWorksheet('Locations'), locations);
    fillIssueDocuments(workbook.addWorksheet('Documents'), documents);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
}

<<<<<<< HEAD
async function loadIssues(three_legged_token, issueContainerID, offset, limit) {
    let page = { offset: offset || 0, limit: limit || 128 };
    console.log('Fetching BIM360 issues page:', page);
    let issues = await bim360V2.listIssuesV2(issueContainerID, three_legged_token, {}, page);
=======
async function loadIssues(bim360, issueContainerID, offset, limit) {
    let page = { offset: offset || 0, limit: limit || 128 };
    console.log('Fetching BIM360 issues page:', page);
    let issues = await bim360.listIssues(issueContainerID, {}, page);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    if ((typeof offset !== 'undefined') || (typeof limit !== 'undefined')) {
        return issues;
    }
    let results = [];
    while (issues.length > 0) {
        results = results.concat(issues);
        page.offset += issues.length;
        console.log('Fetching BIM360 issues page:', page);
<<<<<<< HEAD
        issues = await bim360V2.listIssuesV2(issueContainerID, three_legged_token, {}, page);
=======
        issues = await bim360.listIssues(issueContainerID, {}, page);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    }
    return results;
}

<<<<<<< HEAD
async function loadIssueTypes(three_legged_token, issueContainerID) {
    console.log('Fetching BIM360 issue types.');
    const issueTypes = await bim360V2.listIssueTypesV2(issueContainerID,three_legged_token, true);
=======
async function loadIssueTypes(bim360, issueContainerID) {
    console.log('Fetching BIM360 issue types.');
    const issueTypes = await bim360.listIssueTypes(issueContainerID, true);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    return issueTypes;
}

async function loadUsers(projectId, token) {
    const PageSize = 64;
    console.log('Fetching BIM360 project users.');

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

<<<<<<< HEAD
async function loadLocations(three_legged_token, locationContainerID) {
=======
async function loadLocations(bim360, locationContainerID) {
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    let results = [];
    try {
        let page = { offset: 0, limit: 128 };
        console.log('Fetching BIM360 locations page:', page);
<<<<<<< HEAD
        let locations = await bim360V2.listLocationNodes(locationContainerID,three_legged_token);
        // while (locations.length > 0) {
        //     results = results.concat(locations);
        //     page.offset += locations.length;
        //     console.log('Fetching BIM360 locations page:', page);
        //     locations = await bim360V2.listLocationNodes(locationContainerID, three_legged_token); 
    return locations;

        // }
    } catch (err) {
        console.warn('Could not load BIM360 locations. The "Locations" worksheet will be empty.');
    }
    // return results;
=======
        let locations = await bim360.listLocationNodes(locationContainerID, page);
        while (locations.length > 0) {
            results = results.concat(locations);
            page.offset += locations.length;
            console.log('Fetching BIM360 locations page:', page);
            locations = await bim360.listLocationNodes(locationContainerID, page); 
        }
    } catch (err) {
        console.warn('Could not load BIM360 locations. The "Locations" worksheet will be empty.');
    }
    return results;
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
}

async function loadDocuments(bim360, hubId, projectId) {
    // let results = [];
    // async function collect(folderId) {
    //     const items = await bim360.listContents(projectId, folderId);
    //     const subtasks = [];
    //     for (const item of items) {
    //         switch (item.type) {
    //             case 'items':
    //                 results.push(item);
    //                 break;
    //             case 'folders':
    //                 subtasks.push(collect(item.id));
    //                 break;
    //         }
    //     }
    //     await Promise.all(subtasks);
    // }
    async function listFolderContents(projectId, folderId, token) {
        let url = `https://developer.api.autodesk.com/data/v1/projects/${projectId}/folders/${folderId}/search`;
        let opts = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        };
        let response = await axios.get(url, opts);
        let results = response.data.data;
        while (response.data.links && response.data.links.next) {
            url = response.data.links.next.href;
            response = await axios.get(url, opts);
            results = results.concat(response.data.data);
        }
        return results;
    }

    console.log('Fetching BIM360 documents');
    const folders = await bim360.listTopFolders(hubId, projectId);
    const tasks = folders.map(folder => listFolderContents(projectId, folder.id, bim360.token));
    const results = await Promise.all(tasks);
    return [].concat.apply([], results);
}

function fillIssues(worksheet, issues, types, users, locations, documents) {
    const IssueTypeFormat = (issueSubtypeID) => {
        let issueTypeID, issueTypeName, issueSubtypeName;
        for (const issueType of types) {
            for (const issueSubtype of issueType.subtypes) {
                if (issueSubtype.id === issueSubtypeID) {
                    issueTypeID = issueType.id;
                    issueTypeName = issueType.title;
                    issueSubtypeName = issueSubtype.title;
                    return encodeNameID(`${issueTypeName} > ${issueSubtypeName}`, `${issueTypeID},${issueSubtypeID}`);
                }
            }
        }
        return '';
    };

    const IssueOwnerFormat = (ownerID) => {
        const user = users.find(u => u.autodeskId === ownerID);
        if (user) {
            return encodeNameID(user.name, user.autodeskId);
        } else {
            return '';
        }
    };

    const IssueLocationFormat = (locationID) => {
        const location = locations.find(l => l.id === locationID);
        if (location) {
            return encodeNameID(location.name, location.id);
        } else {
            return '';
        }
    };

    const IssueDocumentFormat = (documentID) => {
<<<<<<< HEAD

        if(documentID.length > 0){
            const documentUrn = documentID[0].urn;

            const document = documents.find(d => d.relationships.item && d.relationships.item.data.id === documentUrn);
            return encodeNameID(document.attributes.displayName, document.id);
        }
        else {
            return '';
        }
        
        // if (document) {
        //     return encodeNameID(document.attributes.displayName, document.id);
        // } else {
        //     return '';
        // }
=======
        const document = documents.find(d => d.relationships.item && d.relationships.item.data.id === documentID);
        if (document) {
            return encodeNameID(document.attributes.displayName, document.id);
        } else {
            return '';
        }
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    };

    const IssueTypeValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Types!E:E']
    };

    const IssueStatusValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"void,draft,open,answered,work_completed,ready_to_inspect,in_dispute,not_approved,closed"']
    };

    const IssueOwnerValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Owners!C:C']
    };

    const IssueLocationValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Locations!D:D']
    };

    const IssueDocumentValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['Documents!C:C']
    };

    const IssueColumns = [
        { id: 'id',             propertyName: 'id',                     columnTitle: 'ID',          columnWidth: 8,     locked: true },
<<<<<<< HEAD
        { id: 'type',           propertyName: 'issueSubtypeId',         columnTitle: 'Type',        columnWidth: 16,    locked: true,   format: IssueTypeFormat,        validation: IssueTypeValidation },
        { id: 'title',          propertyName: 'title',                  columnTitle: 'Title',       columnWidth: 32,    locked: false },
        { id: 'description',    propertyName: 'description',            columnTitle: 'Description', columnWidth: 32,    locked: false },
        { id: 'owner',          propertyName: 'ownerId',                columnTitle: 'Owner',       columnWidth: 16,    locked: true,   format: IssueOwnerFormat,       validation: IssueOwnerValidation },
        { id: 'location',       propertyName: 'locationId',             columnTitle: 'Location',    columnWidth: 16,    locked: true,   format: IssueLocationFormat,    validation: IssueLocationValidation },
        { id: 'document',       propertyName: 'linkedDocuments',        columnTitle: 'Document',    columnWidth: 32,    locked: true,   format: IssueDocumentFormat,    validation: IssueDocumentValidation },
        { id: 'status',         propertyName: 'status',                 columnTitle: 'Status',      columnWidth: 16,    locked: false,                                  validation: IssueStatusValidation },
        // { id: 'answer',         propertyName: 'answer',                 columnTitle: 'Answer',      columnWidth: 32,    locked: false },
        { id: 'comments',       propertyName: 'commentCount',           columnTitle: 'Comments',    columnWidth: 8,     locked: true },
        { id: 'attachments',    propertyName: 'attachmentCount',       columnTitle: 'Attachments', columnWidth: 8,     locked: true }
=======
        { id: 'type',           propertyName: 'ng_issue_subtype_id',    columnTitle: 'Type',        columnWidth: 16,    locked: true,   format: IssueTypeFormat,        validation: IssueTypeValidation },
        { id: 'title',          propertyName: 'title',                  columnTitle: 'Title',       columnWidth: 32,    locked: false },
        { id: 'description',    propertyName: 'description',            columnTitle: 'Description', columnWidth: 32,    locked: false },
        { id: 'owner',          propertyName: 'owner',                  columnTitle: 'Owner',       columnWidth: 16,    locked: true,   format: IssueOwnerFormat,       validation: IssueOwnerValidation },
        { id: 'location',       propertyName: 'lbs_location',           columnTitle: 'Location',    columnWidth: 16,    locked: true,   format: IssueLocationFormat,    validation: IssueLocationValidation },
        { id: 'document',       propertyName: 'target_urn',             columnTitle: 'Document',    columnWidth: 32,    locked: true,   format: IssueDocumentFormat,    validation: IssueDocumentValidation },
        { id: 'status',         propertyName: 'status',                 columnTitle: 'Status',      columnWidth: 16,    locked: false,                                  validation: IssueStatusValidation },
        { id: 'answer',         propertyName: 'answer',                 columnTitle: 'Answer',      columnWidth: 32,    locked: false },
        { id: 'comments',       propertyName: 'comment_count',          columnTitle: 'Comments',    columnWidth: 8,     locked: true },
        { id: 'attachments',    propertyName: 'attachment_count',       columnTitle: 'Attachments', columnWidth: 8,     locked: true }
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    ];

    worksheet.columns = IssueColumns.map(col => {
        return { key: col.id, header: col.columnTitle, width: col.columnWidth };
    });
    for (const issue of issues) {
        let row = {};
        for (const column of IssueColumns) {
            if (column.format) {
                row[column.id] = column.format(issue[column.propertyName]);
            } else {
                row[column.id] = issue[column.propertyName];
            }
        }
        worksheet.addRow(row);
    }

    // Setup data validation and protection where needed
    for (const column of IssueColumns) {
        if (column.locked || column.validation) {
            worksheet.getColumn(column.id).eachCell(function (cell) {
                if (column.locked) {
                    cell.protection = {
                        locked: true
                    };
                }
                if (column.validation) {
                    cell.dataValidation = column.validation;
                }
            });
        }
    }
}

function fillIssueTypes(worksheet, issueTypes) {
    worksheet.columns = [
        { key: 'type-id', header: 'Type ID', width: 16 },
        { key: 'type-name', header: 'Type Name', width: 32 },
        { key: 'subtype-id', header: 'Subtype ID', width: 16 },
        { key: 'subtype-name', header: 'Subtype Name', width: 32 },
        { key: 'type-full', header: '', width: 64 } // Full representation to show in the "issues" worksheet (that can be later decoded back into IDs)
    ];

    for (const issueType of issueTypes) {
        for (const issueSubtype of issueType.subtypes) {
            worksheet.addRow({
                'type-id': issueType.id,
                'type-name': issueType.title,
                'subtype-id': issueSubtype.id,
                'subtype-name': issueSubtype.title,
                'type-full': encodeNameID(`${issueType.title} > ${issueSubtype.title}`, `${issueType.id},${issueSubtype.id}`)
            });
        }
    }

    // Setup data validation and protection where needed
    for (const column of worksheet.columns) {
        worksheet.getColumn(column.key).eachCell(function (cell) {
            cell.protection = {
                locked: true
            };
        });
    }
}

function fillIssueOwners(worksheet, users) {
    worksheet.columns = [
        { key: 'user-id', header: 'User ID', width: 16 },
        { key: 'user-name', header: 'User Name', width: 32 },
        { key: 'user-full', header: '', width: 64 } // Full representation to show in the "issues" worksheet (that can be later decoded back into IDs)
    ];

    for (const user of users) {
        worksheet.addRow({
            'user-id': user.autodeskId,
            'user-name': user.name,
            'user-full': encodeNameID(user.name, user.autodeskId)
        });
    }

    // Setup data validation and protection where needed
    for (const column of worksheet.columns) {
        worksheet.getColumn(column.key).eachCell(function (cell) {
            cell.protection = {
                locked: true
            };
        });
    }
}

function fillIssueLocations(worksheet, locations) {
    worksheet.columns = [
        { key: 'location-id', header: 'Location ID', width: 16 },
        { key: 'location-parent-id', header: 'Parent ID', width: 16 },
        { key: 'location-name', header: 'Location Name', width: 32 },
        { key: 'location-full', header: '', width: 64 } // Full representation to show in the "issues" worksheet (that can be later decoded back into IDs)
    ];

    for (const location of locations) {
        worksheet.addRow({
            'location-id': location.id,
            'location-parent-id': location.parentId,
            'location-name': location.name,
            'location-full': encodeNameID(location.name, location.id)
        });
    }

    // Setup data validation and protection where needed
    for (const column of worksheet.columns) {
        worksheet.getColumn(column.key).eachCell(function (cell) {
            cell.protection = {
                locked: true
            };
        });
    }
}

function fillIssueDocuments(worksheet, documents) {
    worksheet.columns = [
        { key: 'document-urn', header: 'Document URN', width: 16 },
        { key: 'document-name', header: 'Document Name', width: 32 },
        { key: 'document-full', header: '', width: 64 } // Full representation to show in the "issues" worksheet (that can be later decoded back into IDs)
    ];

    for (const version of documents) {
        if (version.relationships.item) {
            const id = version.relationships.item.data.id;
            const displayName = version.attributes.displayName;
        worksheet.addRow({
                'document-urn': id,
                'document-name': displayName,
                'document-full': encodeNameID(displayName, id)
        });
    }
    }

    // Setup data validation and protection where needed
    for (const column of worksheet.columns) {
        worksheet.getColumn(column.key).eachCell(function (cell) {
            cell.protection = {
                locked: true
            };
        });
    }
}

function encodeNameID(name, id) {
    return {
        'richText': [
            { 'text': `${name}` },
            { 'text': ` [${id}]`, font: { 'color': { 'argb': 'FFCCCCCC' } } }
        ]
    };
}

/**
 * Imports BIM360 issues from XLSX spreadsheet.
 * @async
 * @param {Buffer} buffer XLSX data.
 * @param {string} issueContainerID BIM360 issues container ID.
 * @param {string} threeLeggedToken 3-legged access token for APS requests requiring user context.
 * @param {boolean} [sequential=false] Flag for updating issues sequentially instead of in bulk.
 * @param {array} [range=null] Array of two integers specifying the number range of rows to import.
 * @returns {object} Results object listing successfully created issues (in 'succeeded' property)
 * and errors (in 'failed' property).
 */
async function importIssues(buffer, issueContainerID, threeLeggedToken, sequential = false, range = null) {
    let results = {
        succeeded: [],
        failed: []
    };

    // If cell value contains rich text, convert it to regular text
    function unrich(val) {
        val = val || '';
        if (typeof val === 'object' && val.hasOwnProperty('richText')) {
            return val.richText.map(richText => richText.text).join('');
        } else {
            return val;
        }
    }

    console.log('Parsing XLSX spreadsheet.');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet('Issues');

    const bim360 = new BIM360Client({ token: threeLeggedToken });
    // Instead of blindly overwriting all fields from the spreadsheet,
    // fetch the latest state of the issues from BIM360 and only
    // update those that have (and _can_ be) changed.
    console.log('Fetching latest BIM360 issues.');
<<<<<<< HEAD
    const issues = await loadIssues(threeLeggedToken, issueContainerID) 
    // const issues = await loadIssues(bim360, issueContainerID);
=======
    const issues = await loadIssues(bim360, issueContainerID);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032

    if (sequential) {
        console.log('Parsing spreadsheet data.');
    } else {
        console.log('Updating BIM360 issues.');
    }

    const tasks = []; // Can be either promises, or objects with update params (if `sequential` mode is used)
<<<<<<< HEAD
    worksheet.eachRow(function(row, rowNumber) {
=======
    worksheet.eachRow(function (row, rowNumber) {
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
        if (rowNumber === 1) {
            return; // Skip the header row
        }

        if (range && (rowNumber < range[0] || rowNumber > range[1])) {
            return; // Skip row numbers not included in the `range` parameter
        }

        try {
            const issueID = row.values[1];
            const currentIssueAttributes = issues.find(issue => issue.id === issueID);
<<<<<<< HEAD


            const newIssueTypeMatch = unrich(row.values[2]).match(/.+\[(.+),(.+)\]$/);


=======
            const newIssueTypeMatch = unrich(row.values[2]).match(/.+\[(.+),(.+)\]$/);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
            if (!newIssueTypeMatch) {
                results.failed.push({ id: issueID, row: rowNumber, error: 'Could not parse issue type and subtype IDs.' });
                return;
            }
            const newIssueOwner = unrich(row.values[5]).match(/.+\[(.+)\]$/);
            if (!newIssueOwner) {
                results.failed.push({ id: issueID, row: rowNumber, error: 'Could not parse issue owner ID.' });
                return;
            }
            const newIssueLocation = unrich(row.values[6]).match(/.+\[(.+)\]$/);
            // if (!newIssueLocation) {
            //     results.failed.push({ id: issueID, error: 'Could not parse issue location ID.' });
            //     return;
            // }
            const newIssueAttributes = {
<<<<<<< HEAD
                issueTypeId: newIssueTypeMatch[1],
                issueSubtypeId: newIssueTypeMatch[2],
                title: unrich(row.values[3]),
                description: unrich(row.values[4]),
                ownerId: newIssueOwner[1],
                locationId: newIssueLocation ? newIssueLocation[1] : null,
                //document: ...
                status: unrich(row.values[8]),
                // answer: unrich(row.values[9])
=======
                ng_issue_type_id: newIssueTypeMatch[1],
                ng_issue_subtype_id: newIssueTypeMatch[2],
                title: unrich(row.values[3]),
                description: unrich(row.values[4]),
                owner: newIssueOwner[1],
                lbs_location: newIssueLocation ? newIssueLocation[1] : null,
                //document: ...
                status: unrich(row.values[8]),
                answer: unrich(row.values[9])
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
            };

            // Check if the issue exists in BIM360
            if (!currentIssueAttributes) {
                //results.failed.push({ id: issueID, row: rowNumber, error: 'Issue not found in BIM360.' });
<<<<<<< HEAD
                tasks.push(createIssue(threeLeggedToken, issueContainerID, newIssueAttributes, results));
 
            }else{

                const issueNumber = currentIssueAttributes.displayId;
                console.log("updated issue displayId", issueNumber)
=======
                tasks.push(createIssue(bim360, issueContainerID, newIssueAttributes, results));
 
            }else{

                const issueNumber = currentIssueAttributes.identifier;
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032

                // Check if any of the new issue properties differ from the original in BIM360, and if they *can* be changed
                let blockedAttributeUpdates = [];
                for (const key of Object.getOwnPropertyNames(newIssueAttributes)) {
                    if (currentIssueAttributes[key] == newIssueAttributes[key]) { // both values are equal
                        delete newIssueAttributes[key];
                    } else if (!currentIssueAttributes[key] && !newIssueAttributes[key]) { // both values are "falsy" (e.g., an empty string and a null)
<<<<<<< HEAD

                        delete newIssueAttributes[key];
                    } 
                    else if (currentIssueAttributes.permittedAttributes.indexOf(key) === -1) { // field change not permitted
                        console.log("currentIssueAttributes[key] == newIssueAttributes[key] : field change not permitted", currentIssueAttributes.permitted_attributes.indexOf(key))
=======
                        delete newIssueAttributes[key];
                    } else if (currentIssueAttributes.permitted_attributes.indexOf(key) === -1) { // field change not permitted
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
                        blockedAttributeUpdates.push(key);
                    }
                }
                // if (blockedAttributeUpdates.length > 0) {
                //     results.failed.push({ number: issueNumber, id: issueID, error: `Changing these issue fields is not permitted: ${blockedAttributeUpdates.join(', ')}.` });
                //     return;
                // }
                if (Object.getOwnPropertyNames(newIssueAttributes).length === 0) {
                    return; // No fields to update
                }
    
                if (sequential) {
                    tasks.push({ bim360, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results });
                } else {
<<<<<<< HEAD
                    tasks.push(updateIssue(threeLeggedToken, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results));
=======
                    tasks.push(updateIssue(bim360, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results));
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
                }
            } 
        } catch (err) {
            console.error('Error when parsing spreadsheet row', rowNumber);
            throw new Error(err);
        }
    });

    if (sequential) {
        for (const task of tasks) {
            const { bim360, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results } = task;
            console.log('Updating issue', issueID);
<<<<<<< HEAD
            await updateIssue(threeLeggedToken, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results);
=======
            await updateIssue(bim360, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributeUpdates, issueNumber, results);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
        }
    } else {
        console.log('Waiting for all updates to complete.');
        await Promise.all(tasks);
    }

    return results;
}

<<<<<<< HEAD
async function updateIssue(threeLeggedToken, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributes, issueNumber, results) {
=======
async function updateIssue(bim360, issueContainerID, issueID, currentIssueAttributes, newIssueAttributes, blockedAttributes, issueNumber, results) {
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
    try {
        // If some attributes are not permitted to be changed, try temporarily switching to issue status "open"
        if (blockedAttributes.length > 0) {
            const _status = currentIssueAttributes.status;
<<<<<<< HEAD
            updatedIssue = await bim360V2.updateIssue(issueContainerID, issueID, { status: 'open' }, threeLeggedToken);
            updatedIssue = await bim360V2.updateIssue(issueContainerID, issueID, newIssueAttributes, threeLeggedToken);
            if (!newIssueAttributes.status) {
                updatedIssue = await bim360V2.updateIssue(issueContainerID, issueID, { status: _status }, threeLeggedToken);
=======
            updatedIssue = await bim360.updateIssue(issueContainerID, issueID, { status: 'open' });
            updatedIssue = await bim360.updateIssue(issueContainerID, issueID, newIssueAttributes);
            if (!newIssueAttributes.status) {
                updatedIssue = await bim360.updateIssue(issueContainerID, issueID, { status: _status });
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
            }
            results.succeeded.push({
                number: issueNumber,
                id: issueID,
                issue: updatedIssue
            });
        } else {
<<<<<<< HEAD
            const updatedIssue = await bim360V2.updateIssue(issueContainerID, issueID, newIssueAttributes, threeLeggedToken);
=======
            const updatedIssue = await bim360.updateIssue(issueContainerID, issueID, newIssueAttributes);
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
            results.succeeded.push({
                number: issueNumber,
                id: issueID,
                issue: updatedIssue
            });
        }
    } catch (err) {
        results.failed.push({
            number: issueNumber,
            id: issueID,
            error: JSON.stringify(err)
        });
    }
}

<<<<<<< HEAD
async function createIssue(threeLeggedToken, issueContainerID, newIssueAttributes, results) {
    try { 
        const createdIssue = await bim360V2.createIssue(issueContainerID, newIssueAttributes, threeLeggedToken);
        results.succeeded.push({
            number: createdIssue.displayId,
=======
async function createIssue(bim360, issueContainerID, newIssueAttributes, results) {
    try { 
        const createdIssue = await bim360.createIssue(issueContainerID, newIssueAttributes);
        results.succeeded.push({
            number: createdIssue.identifier,
>>>>>>> b2a7fcf7fd4828ce3d977a646d66cb54de30e032
            id: createdIssue.id,
            issue: createdIssue
        }); 
    } catch (err) {
        results.failed.push({
            number: 'new issue failed- no number',
            id: 'new issue failed - no id',
            error: JSON.stringify(err)
        });
    }
}

module.exports = {
    exportIssues,
    importIssues
};
