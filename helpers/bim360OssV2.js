const axios = require('axios').default;


const base_url = 'https://developer.api.autodesk.com';


async function downloadAttachment(urn, projectId, token) {
   
        //Extract bucket and object key from urn
        var split_by_splash = urn.split("/") 
        var split_by_colon = split_by_splash[0].split(":")
        attachment_object_key = split_by_splash[1]
        attachment_bucket_key = split_by_colon[3] 

      // Generate a signed S3 URL
      const res = await getS3SignedDownloadUrl(attachment_bucket_key,attachment_object_key, token)
      const s3_download_url = res.data.url 
   
    const body = await getBinary(s3_download_url) 
    const buffer = await toBuffer(body)
    if (buffer) {
      console.log('Attachment File saved.')  
      return buffer 
    } else {
      return null
    }
    
    }
    
  async function getS3SignedDownloadUrl(bucketKey,objectKey,three_legged_token) {
    
       
        let opts = {
            headers: {
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
    } 

    async function getResourceTipVersion(projectId,itemId,three_legged_token) {
    
       
      let opts = {
          headers: {
              'Authorization': `Bearer ${three_legged_token}`
          }
      };
      
      const endpoint = `${base_url}/data/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/tip`;

    const response = await axios.get(endpoint, opts);

    if (response) {
      console.log(`get resource tip version...` )
      return response 
    } else {
      return null
    }
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

async function toBuffer(stream) {
    const list = []
    const reader = stream.getReader()
    while (true) {
      const { value, done } = await reader.read()
      if (value)
        list.push(value)
      if (done)
        break
    }
    return Buffer.concat(list)
  }

module.exports = {
    downloadAttachment,
    getResourceTipVersion
};
