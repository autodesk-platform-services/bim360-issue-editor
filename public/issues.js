
function escape(str) {
    return $('<div>').text(str).html();
}


class IssueView {
    constructor(userClient, issueClient, locationClient, docsClient) {
        this.userClient = userClient;
        this.issueClient = issueClient;
        this.locationClient = locationClient;
        this.docsClient = docsClient;
        this.page = 0;
        this.pageSize = 15;
        this.users = [];
        this.issueTypes = [];
        this.rootCauses = [];
        this.locations = [];
        this.rootCauses = [];
    }

    async init() {
        // Initialize issue owners and types
        this.showSpinner('Initializing issue owners and types...');
        try {
            const rootCauses = await this.issueClient.listRootCauses()

            const [users, issueTypes] = await Promise.all([
                this.userClient.listUsers(),
                this.issueClient.listIssueTypes(),
            ]);
          
            this.users = users
            this.issueTypes = issueTypes;
            this.rootCauses = rootCauses;

        

        } catch (err) {
            this.hideSpinner();
            $.notify('Could not initialize issues.\nEither your project has no users, issueTypes or rootCauses associated .', 'error');
            console.error('Could not initialize issues.', err);
            return;
        }
        // Try initialize locations separately, and proceed even if they aren't available
        try {
            this.locations = await this.locationClient.listLocations();
        } catch (err) {
            $.notify('Could not obtain locations.\nAPS application does not have access to this feature.', 'warning');
            console.warn('Could not obtain locations.', err);
        }
        this.hideSpinner();

        this.initFiltering();
        this.initPagination();

        const $table = $('#issues-table');
        const $tbody = $table.find('tbody');
        let updating = false;
        const update = () => {
            if (!updating) {
                updating = true;
                this.update().finally(() => { updating = false; });
            }
        };

        // Enable buttons on rows that have been modified
        $tbody.on('change', (ev) => {
            const $target = $(ev.target);
            $target.closest('tr').find('button.update-issue').removeAttr('disabled');
            $('#update-issues-button').removeAttr('disabled');

            // If issue type is changed, update the corresponding subtype dropdown as well
            if ($target.hasClass('issue-type')) {
                const issueTypeId = $target.val();
                const issueType = this.issueTypes.find(it => it.id === issueTypeId);
                const issueSubtypes = issueType ? issueType.subtypes : [];
                const $issueSubtypeDropdown = $target.closest('tr').find('select.issue-subtype');
                $issueSubtypeDropdown.empty();
                for (const issueSubtype of issueSubtypes) {
                    $issueSubtypeDropdown.append(`<option value="${issueSubtype.id}">${escape(issueSubtype.title)}</option>`)
                }
            }
        });

        // Update issue when button in its row is clicked
        $tbody.on('click', (ev) => {
            const $target = $(ev.target);
            if ($target.hasClass('update-issue') && $target.data('issue-id')) {
                const issueId = $target.data('issue-id');
                const $tr = $target.closest('tr');
                const attrs = {};
                function addAttributeIfChanged(attrName, selector) {
                    const $el = $tr.find(selector);
                    const originalValue = $el.data('original-value');
                    const currentValue = $el.val();
                    if (currentValue !== originalValue) {
                        attrs[attrName] = currentValue;
                    }
                }
                addAttributeIfChanged('title', 'input.issue-title');
                addAttributeIfChanged('description', 'input.issue-description');
                addAttributeIfChanged('status', 'select.issue-status');
                addAttributeIfChanged('locationId', 'select.issue-location');
                addAttributeIfChanged('ownerId', 'select.issue-owner');
                addAttributeIfChanged('dueDate', 'input.issue-due-date');
                addAttributeIfChanged('issueTypeId', 'select.issue-type');
                addAttributeIfChanged('issueSubtypeId', 'select.issue-subtype');
                this.issueClient.updateIssue(issueId, attrs)
                    .then(function (issue) {
                        $target.closest('button').attr('disabled', true);
                        // If no other buttons are enabled, disable the "update all" button as well
                        if ($('#issues-table button.update-issue:enabled').length === 0) {
                            $('#update-issues-button').attr('disabled', true);
                        }
                        $.notify('Issue(s) successfully updated.', 'success');
                        console.log('Issue(s) successfully updated.', issue);
                        update();
                    })
                    .catch(function (err) {
                        $.notify('Could not update issue(s).\nSee console for more details.', 'error');
                        console.error('Could not update issue(s).', err);
                    });
            }
        });

        // Setup button for updating all modified issues
        $('#update-issues-button').on('click', () => {
            $('#issues-table button:enabled').trigger('click');
        });

        // Setup button for importing issues
        const issueContainerId = this.issueClient.issueContainerId;
        const $import = $('#import-issues');
        $import.on('click', function () {
            $('#hidden-upload-file').click();
        });
        $('#hidden-upload-file').on('change', async function () {
            if (this.files.length === 1) {
                const oldButtonText = $import.html();
                $import.attr('disabled', true).text('Importing ...');
                const formData = new FormData();
                formData.append('xlsx', this.files[0]);
                const response = await fetch(`/api/issues/${issueContainerId}/import`, {
                    method: 'POST',
                    body: formData
                });
                if (response.ok) {
                    const results = await response.json();
                    console.log("import console resp", results)
                    if (results.failed && results.failed.length > 0) {
                        $.notify('Issues partially imported.\nSee console for more details.', 'warn');
                        console.log('Issues partially imported.', results);
                        $import.removeAttr('disabled', true).html(oldButtonText);
                    } else {
                        $.notify('Issues successfully imported.\nSee console for more details.', 'info');
                        console.log('Issues successfully imported.', results);
                        $import.removeAttr('disabled', true).html(oldButtonText);
                    }
                    update();
                } else {
                    const err = await response.text();
                    $.notify('Could not import issues.\nSee console for more details.', 'error');
                    console.error('Could not import issues.', err);
                    $import.removeAttr('disabled', true).html(oldButtonText);
                }
            }
        });
        this.update();
    }

    initFiltering() {
        // Created by dropdown
        const $creatorPicker = $('#creator-picker');
        $creatorPicker.empty();
        $creatorPicker.append(`<option value="">(All)</option>`);
        for (const user of this.users) {
            $creatorPicker.append(`<option value="${user.autodeskId}">${escape(user.name)}</option>`);
        }

        // Owner dropdown
        const $ownerPicker = $('#owner-picker');
        $ownerPicker.empty();
        $ownerPicker.append(`<option value="">(All)</option>`);
        for (const user of this.users) {
            $ownerPicker.append(`<option value="${user.autodeskId}">${escape(user.name)}</option>`);
        }

        // Issue type and subtype dropdowns
        const $issueTypePicker = $('#issue-type-picker');
        $issueTypePicker.empty();
        $issueTypePicker.append(`<option value="">(All)</option>`);
        for (const issueType of this.issueTypes) {
            $issueTypePicker.append(`<option value="${issueType.id}">${escape(issueType.title)}</option>`);
        }
        $issueTypePicker.on('change', () => {
            const $issueSubtypePicker = $('#issue-subtype-picker');
            $issueSubtypePicker.empty();
            $issueSubtypePicker.append(`<option value="">(All)</option>`);
            const issueType = this.issueTypes.find(it => it.id === $issueTypePicker.val());
            if (issueType) {
                for (const issueSubtype of issueType.subtypes) {
                    $issueSubtypePicker.append(`<option value="${issueSubtype.id}">${escape(issueSubtype.title)}</option>`);
                }
            }
        });
        $issueTypePicker.trigger('change');

        // Update issues on any filter change
        $('#filter input, #filter select').on('change', () => {
            this.update();
        });
    }

    initPagination() {
        $('#prev-page-link').on('click', () => {
            if (this.page > 0) {
                this.page = this.page - 1;
                this.update();
            }
        });
        $('#next-page-link').on('click', () => {
            this.page = this.page + 1;
            this.update();
        });
    }

    async update() {
        const $container = $('#container');
        const $table = $('#issues-table');
        const $tbody = $table.find('tbody');
    
        $tbody.empty();
        this.showSpinner('Updating issues...');
        const issueClient = this.issueClient;
        // Get issues based on the current filters
       
        let issues = [];
    
        try {
            const issueDisplayId= $('#issue-num-picker').val();
            const issueOwner = $('#owner-picker').val();
            const createdBy = $('#creator-picker').val();
            const issueType = $('#issue-type-picker').val();
            const issueSubtype = $('#issue-subtype-picker').val();
            const dueDate = $('#due-date-picker').val();
            issues = await issueClient.listIssues(issueDisplayId || null, issueOwner || null, createdBy || null, dueDate || null, issueType || null, issueSubtype || null, this.page * this.pageSize, this.pageSize);
        } catch (err) {
            $container.append(`<div class="alert alert-dismissible alert-warning">${err}</div>`);
        } finally {
            this.hideSpinner();
        }

        function disabled(attribute, issue) {
            return issue.permittedAttributes.indexOf(attribute) === -1;
        }

        const generateIssueTypeSelect = (issue) => `
            <select class="custom-select custom-select-sm issue-type" data-original-value="${issue.issueTypeId}"  ${true ? 'disabled' : ''}>
                ${this.issueTypes.map(issueType => `<option  value="${issueType.id}" ${(issueType.id === issue.issueTypeId) ? 'selected' : ''}>${escape(issueType.title)}</option>`).join('\n')}
            </select>
        `;

        const generateRootCauseSelect = (issue) => `
            <select class="custom-select custom-select-sm root-cause" data-original-value="${issue.rootCauseId}" ${true ? 'disabled' : ''}>
                ${this.rootCauses.map(rootCause => `<option value="${rootCause.id}" ${(rootCause.id === issue.rootCauseId) ? 'selected' : ''}>${escape(rootCause.title)}</option>`).join('\n')}
            </select>
        `;

        
        const generateIssueSubtypeSelect = (issue) => {
            const issueType = this.issueTypes.find(it => it.id === issue.issueTypeId);
            const issueSubtypes = issueType ? issueType.subtypes : [];
            return `
                <select class="custom-select custom-select-sm issue-subtype" data-original-value="${issue.issueSubtypeId}" ${disabled('issueSubtypeId', issue) ? 'disabled' : ''}>
                    ${issueSubtypes.map(issueSubtype => `<option value="${issueSubtype.id}" ${(issueSubtype.id === issue.issueSubtypeId) ? 'selected' : ''}>${escape(issueSubtype.title)}</option>`).join('\n')}
                </select>
            `;
        };

        const generateOwnerSelect = (issue) => `
            <select class="custom-select custom-select-sm issue-owner" data-original-value="${escape(issue.ownerId)}" ${disabled('ownerId', issue) ? 'disabled' : ''}>
                ${this.users.map(user => `<option value="${user.autodeskId}" ${(user.autodeskId === issue.ownerId) ? 'selected' : ''}>${escape(user.name)}</option>`).join('\n')}
            </select>
        `;

        const generateLocationSelect = (issue) => `
            <select class="custom-select custom-select-sm issue-location" data-original-value="${issue.locationId}" ${this.locations.length === 0 ? 'style="display:none"' : ''} ${disabled('locationId', issue) ? 'disabled' : ''}>
                <option value=""></option>
                ${this.locations.map(location => {
                    let name = location.name;
                    let parentId = location.parentId;
                    while (parentId) {
                        const parent = this.locations.find(l => l.id === parentId);
                        name = escape(parent.name + ' > ' + name);
                        parentId = parent.parentId;
                    }
                    return `<option value="${location.id}" ${(location.id === issue.locationId) ? 'selected' : ''}>${name}</option>`;
                }).join('\n')}
            </select>
        `;

    
        
        const StatusOptions = ['void', 'draft', 'open', 'answered', 'work_completed', 'ready_to_inspect', 'in_dispute', 'not_approved', 'closed'];

        const generateStatusSelect = (issue) => `
            <select class="custom-select custom-select-sm issue-status" data-original-value="${issue.status}" ${disabled('status', issue) ? 'disabled' : ''}>
                ${StatusOptions.map(_status => `<option value="${_status}" ${(_status === issue.status) ? 'selected' : ''}>${_status}</option>`).join('\n')}
            </select>
        `;

        $('#pagination li.page-item.disabled span').text(`Issues ${this.page * this.pageSize + 1}-${(this.page + 1) * this.pageSize}`);

        // Update the table
        for (const issue of issues) {
            const title = escape(issue.title || '');
            const description = escape(issue.description || '');
            const dueDate = escape(issue.dueDate || '')
            $tbody.append(`
                <tr>
                    <td class="center">
                        ${issue.displayId}
                    </td>
                    <td>
                        ${generateIssueTypeSelect(issue)}
                    </td>
                    <td>
                        ${generateIssueSubtypeSelect(issue)}
                    </td>
                    
                    <td>
                        ${generateRootCauseSelect(issue)}
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm issue-title" data-original-value="${title}" value="${title}" ${disabled('title', issue) ? 'disabled' : ''}>
                    </td>
                    <td>
                        <input type="text" class="form-control form-control-sm issue-description" data-original-value="${description}" value="${description}" ${disabled('description', issue) ? 'disabled' : ''}>
                    </td>
                    <td>
                        ${generateOwnerSelect(issue)}
                    </td>
                    <td>
                        ${generateLocationSelect(issue)}
                    </td>
                    <td>
                    <input type="text" class="form-control form-control-sm issue-document" data-target-urn="${issue.linkedDocuments.length > 0 ? issue.linkedDocuments[0].urn : ''}"   value="Loading..." disabled>
               </td>
                    <td>
                        ${generateStatusSelect(issue)}
                    </td>
                    <td>
                    <input type="date" class="form-control form-control-sm issue-due-date" data-due-date="${issue.dueDate}" data-original-value="${dueDate}"  value="${issue.dueDate}" ${disabled('dueDate', issue) ? 'disabled' : ''}>
               </td>
                   
                    <td class="center">
                        ${
                            issue.commentCount
                            ? `<button type="button" class="btn btn-outline-info btn-sm issue-comments" data-issue-id="${issue.id}" data-toggle="popover" title="Comments" data-content="Loading...">${issue.commentCount}</button>`
                            : '0'
                        }
                    </td>
                    <td class="center">
                        ${
                            issue.attachmentCount
                            ? `<button type="button" class="btn btn-outline-info btn-sm issue-attachments" data-issue-id="${issue.id}" data-toggle="popover" title="Attachments" data-content="Loading...">${issue.attachmentCount}</button>`
                            : '0'
                        }
                    </td>
                    <td>
                        <button type="button" data-issue-id="${issue.id}" class="btn btn-sm btn-success update-issue" disabled>
                            <i data-issue-id="${issue.id}" class="fas fa-cloud-upload-alt update-issue"></i>
                        </button>
                    </td>
                </tr>
            `);
        }

        // Retrieve details of all linked documents
        let documentPromiseCache = new Map();
        // console.log("documentPromiseCache issue.js: 359", documentPromiseCache)
        const docsClient = this.docsClient;
        $tbody.find('input.issue-document').each(async function () {
            const $input = $(this);
            const urn = $input.data('target-urn');


            if (!urn || urn == null || urn =='urn:adsk.wipprod:dm.lineage:aCGrm3rkTS-EsTNDE8O7Iw') {
                $input.val('');
                return;
            }
            if (!documentPromiseCache.has(urn)) {
                documentPromiseCache.set(urn, docsClient.getItemDetails(urn));
            }
            const promise = documentPromiseCache.get(urn);
            promise
                .then(details => {
                    $input.val(details.displayName);
                })
                .catch(err => {
                    $.notify('Could not retrieve linked docs.\n Invalid document urn.', 'error');
                    console.error('Could not retrieve linked docs.', err);
                    $input.val('');
                });
        });

        // Enable comments/attachments popovers where needed
        let comments = [];

        $tbody.find('button.issue-comments').each(async function () {
            let $this = $(this);
            const issueId = $this.data('issue-id');
            comments = await issueClient.listIssueComments(issueId);
            try {
        
                const html = `
                    <ul>
                        ${comments.map(comment => `<li>
                        [${new Date(comment.createdAt).toLocaleString()}]
                        <div>${escape(comment.body)}</div>
                         </li>
                         `).join('\n')}
                    </ul>
                `;
                $this.attr('data-content', html);
            } catch(err) {
                $this.attr('data-content', `Could not load comments: ${err}`);
            } finally {
                $this.popover({ html: true, trigger: 'manual' })
                    .on('mouseenter', function () {
                        const _this = this;
                        $(this).popover('show');
                        $('.popover').on('mouseleave', function () { $(_this).popover('hide'); });
                    }).on('mouseleave', function () {
                        const _this = this;
                        setTimeout(function () {
                            if (!$('.popover:hover').length) { $(_this).popover('hide'); }
                        }, 300);
                    });
            }
        });

        const issueContainerId = this.issueClient.issueContainerId;
        let attachments =[];
        $tbody.find('button.issue-attachments').each(async function () {
            let $this = $(this);
            const issueId = $this.data('issue-id');

            try {
                attachments = await issueClient.listIssueAttachments(issueId);
                const html = `
                    <ul>
                        ${attachments.map(attachment => `
                            <li>
                                [${new Date(attachment.createdAt).toLocaleString()}]
                                <a target="_blank" href="/api/issues/${issueContainerId}/${issueId}/attachments/${attachment.id}">
                                    <div>${escape(attachment.name)}</div>
                                    ${
                                        (attachment.name.toLowerCase().endsWith('.png') || attachment.name.toLowerCase().endsWith('.jpg') || attachment.name.toLowerCase().endsWith('.jpeg'))
                                            ? `<img alt="Loading..." src="/api/issues/${issueContainerId}/${issueId}/attachments/${attachment.id}" width="64">`
                                            : ''
                                    }
                                </a>
                            </li>
                        `).join('\n')}
                    </ul>
                `;
                $this.attr('data-content', html);
            } 
            catch(err) {
                $this.attr('data-content', `Could not load attachments: ${err}`);
            }
             finally {
                $this.popover({ html: true, trigger: 'manual' })
                    .on('mouseenter', function () {
                        const _this = this;
                        $(this).popover('show');
                        $('.popover').on('mouseleave', function () { $(_this).popover('hide'); });
                    }).on('mouseleave', function () {
                        const _this = this;
                        setTimeout(function () {
                            if (!$('.popover:hover').length) { $(_this).popover('hide'); }
                        }, 300);
                    });
            }
        });
    }
    showSpinner(message = 'Loading...') {
        $('#container').append(`
            <div id="issues-loading-spinner" class="d-flex justify-content-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="sr-only">${escape(message)}</span>
                </div>
            </div>
        `);
    }

    hideSpinner() {
        $('#issues-loading-spinner').remove();
    }
}

class IssueClient {
    constructor(issueContainerId, region) {
        this.issueContainerId = issueContainerId;
        this.region = region;
    }

    async _get(endpoint, params = {}) {
        const url = new URL(`/api/issues/${this.issueContainerId}` + endpoint, window.location.origin);
        url.searchParams.append('region', this.region);
        for (const key of Object.keys(params)) {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        }
        const response = await fetch(url.toString());

        if (response.ok) {
            const json = await response.json();

            return json;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    }
    
    async _patch(endpoint, body, params = {}) {
        const url = new URL(`/api/issues/${this.issueContainerId}` + endpoint, window.location.origin);
        url.searchParams.append('region', this.region);
        for (const key of Object.keys(params)) {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        }
        const response = await fetch(url.toString(), {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)

        });
        if (response.ok) {
            const json = await response.json();

            return json;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    }

    async listIssues(displayId = null, ownerId = null, createdBy = null, dueDate = null, issueType = null, issueSubtype = null, offset = null, limit = null) {
        
            return this._get(``, {
                displayId,
                ownerId,
                createdBy: createdBy,
                dueDate: dueDate,
                issueTypeId: issueType,
                issueSubtypeId: issueSubtype,
                offset, limit
            });

    }

    async updateIssue(issueId, attrs) {
        return this._patch(`/${issueId}`, attrs);
    }
    async listIssueAttachments(issueId,  offset = null, limit = null) {
        
        return this._get(`/${issueId}/attachments`,  { offset, limit });
    }

    async listIssueComments(issueId, offset = null, limit = null) {

        // return this._get(`/${issueId}/comments`, { offset, limit });
        return this._get(`/${issueId}/comments`,  { offset, limit });

    }
    
    async listRootCauses() {
        return this._get(`/root-causes`);
    }

    async listIssueTypes() {
        return this._get(`/issue-types`);
    }

    async listAttributeDefinitions() {
        return this._get(`/attr-definitions`);
    }

    async listAttributeMappings() {
        return this._get(`/attr-mappings`);
    }
}

class UsersClient {
    constructor(projectId, region) {
        this.projectId = projectId;
        this.region = region;
    }

    async listUsers() {
        const url = new URL(`/api/users/${this.projectId}`, window.location.origin);
        url.searchParams.append('region', this.region);
        const response = await fetch(url.toString());
        if (response.ok) {
            const json = await response.json();
            return json;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    }
}

class LocationClient {
    constructor(issueContainerId, region) {
        this.issueContainerId = issueContainerId;
        this.region = region;
    }

    async _get(endpoint = '', params = {}) {
        const url = new URL(`/api/locations/${this.issueContainerId}` + endpoint, window.location.origin);
        url.searchParams.append('region', this.region);
        for (const key of Object.keys(params)) {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        }
        const response = await fetch(url.toString());
        if (response.ok) {
            const json = await response.json();

            return json;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    }

    async listLocations() {
        // Download the locations in batch to prevent server timeout
        const PageSize = 256
        let offset = 0;
        let results = [];
        let locations = await this._get('', {})
        // let locations = await this._get('', { offset, limit: PageSize })

        // while (locations.length > 0) {
        //     results = results.concat(locations);
        //     offset += PageSize;
        //     // locations = await this._get('', { offset, limit: PageSize })
        //     locations = await this._get('', {})

        // }
        return locations;
    }
}

class DocsClient {
    constructor(projectId, region) {
        this.projectId = projectId;
        this.region = region;
    }

    async _get(endpoint = '', params = {}) {
        const url = new URL(`/api/docs/${this.projectId}` + endpoint, window.location.origin);
        url.searchParams.append('region', this.region);
        for (const key of Object.keys(params)) {
            if (params[key]) {
                url.searchParams.append(key, params[key]);
            }
        }
        const response = await fetch(url.toString());
        if (response.ok) {
            const json = await response.json();
            return json;
        } else {
            const message = await response.text();
            throw new Error(message);
        }
    }

    async getItemDetails(itemId) {
        const details = await this._get(`/${itemId}`);
        return details;
    }
    // async getLinkedDoc(issue) {
    //     // const details = await this._get(`/${itemId}`);
    //     const urn = issue.linkedDocuments.urn;
    //     return urn;
    // }
}
