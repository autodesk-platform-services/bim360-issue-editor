const path = require('path');
const express = require('express');
const session = require('cookie-session');

const PORT = process.env.PORT || 3000;
const { SERVER_SESSION_SECRET, APS_APP_NAME, APS_CLIENT_ID, APS_CLIENT_SECRET, HOST_URL, CLI_CONFIG_PASSWORD, ALLOW_CONFIG_DOWNLOAD } = process.env;
if (!SERVER_SESSION_SECRET || !APS_APP_NAME || !APS_CLIENT_ID || !APS_CLIENT_SECRET || !HOST_URL || !CLI_CONFIG_PASSWORD, ALLOW_CONFIG_DOWNLOAD) {
    console.error('Some of the following env. variables are missing:');
    console.error('SERVER_SESSION_SECRET, APS_APP_NAME, APS_CLIENT_ID, APS_CLIENT_SECRET, HOST_URL, CLI_CONFIG_PASSWORD, ALLOW_CONFIG_DOWNLOAD');


    console.error('missing env. variables set');
    return;
}

let app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// app.use(express.static('build'));
// app.use(session({
//     name: 'Bim360IssuesDemoSession',
//     keys: [SERVER_SESSION_SECRET],
//     maxAge: 7 * 24 * 60 * 60 * 1000
// }));
app.use(session({ secret: SERVER_SESSION_SECRET, maxAge: 24 * 60 * 60 * 1000 }));
app.use('/auth', require('./routes/auth'));
// app.use('/auth', require('./routes/auth1'));
app.use('/api/users', require('./routes/api/users'));
app.use('/api/docs', require('./routes/api/docs'));
app.use('/api/issues', require('./routes/api/issues'));
app.use('/api/locations', require('./routes/api/locations'));
app.use('/', require('./routes/index'));
app.listen(PORT, () => { console.log(`Server listening on port ${PORT}...`); });
