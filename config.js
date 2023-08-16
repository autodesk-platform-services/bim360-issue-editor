const PORT = process.env.PORT || 3000;
const { APS_APP_NAME, APS_CLIENT_ID, APS_CLIENT_SECRET, HOST_URL, APS_CALLBACK_URL, SENDGRID_API_KEY, SERVER_SESSION_SECRET,ALLOW_CONFIG_DOWNLOAD } = process.env;
if (!SERVER_SESSION_SECRET || !APS_APP_NAME || !APS_CLIENT_ID || !APS_CLIENT_SECRET || !HOST_URL || !ALLOW_CONFIG_DOWNLOAD) {
    console.error('Some of the following env. variables are missing:');
    console.error('SERVER_SESSION_SECRET, APS_APP_NAME, APS_CLIENT_ID, APS_CLIENT_SECRET, HOST_URL, ALLOW_CONFIG_DOWNLOAD');

    console.error('missing env. variables set');
    return;
}
const INTERNAL_TOKEN_SCOPES = ['viewables:read', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write','account:read']
const PUBLIC_TOKEN_SCOPES = ['viewables:read'];

module.exports = {
    app_name: APS_APP_NAME,
    client_id: APS_CLIENT_ID,
    client_secret: APS_CLIENT_SECRET,
    host_url: HOST_URL,
    sendgrid_key: SENDGRID_API_KEY,
    callback_url: APS_CALLBACK_URL,
    scopes: INTERNAL_TOKEN_SCOPES,
    redirect_uri: `${HOST_URL}/auth/callback`,
    INTERNAL_TOKEN_SCOPES,
    PUBLIC_TOKEN_SCOPES,
    SERVER_SESSION_SECRET
};
