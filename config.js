const { APS_APP_NAME, APS_CLIENT_ID, APS_CLIENT_SECRET, HOST_URL, SENDGRID_API_KEY } = process.env;



module.exports = {
    app_name: APS_APP_NAME,
    client_id: APS_CLIENT_ID,
    client_secret: APS_CLIENT_SECRET,
    host_url: HOST_URL,
    sendgrid_key: SENDGRID_API_KEY,
    scopes: ['viewables:read', 'bucket:create', 'bucket:read', 'data:read', 'data:create', 'data:write'],
    redirect_uri: `${HOST_URL}/auth/callback`
};
