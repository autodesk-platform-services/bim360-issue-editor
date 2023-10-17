const axios = require('axios').default;


const base_url = 'https://developer.api.autodesk.com';


async function downloadAttachment(urn, token) {

        //Extract bucket and object key from urn
        var split_by_splash = urn.split("/") 
        var split_by_colon = split_by_splash[0].split(":")
        attachment_object_key = split_by_splash[1]
        attachment_bucket_key = split_by_colon[3] 


    // const response = await downloadObject(attachment_bucket_key,attachment_object_key, token)
    const response = await downloadObjectStream(attachment_bucket_key,attachment_object_key, token)
    if (response) {
      console.log('Attachment File saved.')  
      return response
    } else {
      return null
    }
    
    }

    async function _getDownloadUrl(bucketKey, objectKey, token ){
     
      const endpoint = `${base_url}/oss/v2/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(objectKey)}/signeds3download`;
      const headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
      };
      const resp = await axios.get(endpoint, { headers });
      return resp.data;
  }


    async function downloadObject(bucketKey, objectKey, token) {
      console.debug('Retrieving download URL');
      const downloadParams = await _getDownloadUrl(bucketKey, objectKey, token);

      console.log("downloadParams url", downloadParams.url)
      if (downloadParams.status !== 'complete') {
          throw new Error('File not available for download yet.');
      }
      const resp = await axios.get(downloadParams.url, {
          responseType: 'arraybuffer',
          onDownloadProgress: progressEvent => {
              const downloadedBytes = progressEvent.currentTarget.response.length;
              const totalBytes = parseInt(progressEvent.currentTarget.responseHeaders['Content-Length']);
              console.debug('Downloaded', downloadedBytes, 'bytes of', totalBytes);
          }
      });
      return resp.data;
  }

  async function downloadObjectStream(bucketKey, objectKey, token) {
    console.debug('Retrieving download URL');
    const downloadParams = await _getDownloadUrl(bucketKey, objectKey,token);
    if (downloadParams.status !== 'complete') {
        throw new Error('File not available for download yet.');
    }
    const resp = await axios.get(downloadParams.url, {
        responseType: 'stream',
        onDownloadProgress: progressEvent => {
            const downloadedBytes = progressEvent.currentTarget.response.length;
            const totalBytes = parseInt(progressEvent.currentTarget.responseHeaders['Content-Length']);
            console.debug('Downloaded', downloadedBytes, 'bytes of', totalBytes);
        }
    });
    return resp.data;

}
  



module.exports = {
    downloadAttachment,
};
