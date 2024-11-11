import axios from 'axios';
import build from './build';
const pinataSecretApiKey = build.REACT_APP_PINATA_SECRET;
const pinataApiKey = build.REACT_APP_PINATA_KEY;
const formData = require('form-data');

export const pinFileToIPFS = async (file) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    let data = new FormData();
    data.append('file', file);
    const metadata = JSON.stringify({
        name : 'testname',
        keyvalues:{
            exampleKey: 'exampleValue'
        }
    });
    data.append('pinataMetadata', metadata);

    const pinataOptions = JSON.stringify({
        cidVersion: 0,
        customPinPolicy: {
            regions: [{
                id: 'FRA1',
                desiredReplicationCount: 1
            },{
                id: 'NYC1',
                desiredReplicationCount: 2
            }
        ]
        }
    });
    data.append('pinataOptions', pinataOptions);

    return await axios.post(url, data, {
        maxBodyLength: Infinity,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey,
        },
    })
    .then((response) => {
        console.log("file uploaded successfully", response.data.IpfsHash);
        return {
            success: true,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        }
    })
    .catch((error) => {
        console.log(error);
        return {
            success: false,
            message: error.message,
        };
    });
};

export const pinJSONToIPFS = async (json) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;
    return axios.post(url, json, {
        headers: {
            'Content-Type': 'application/json',
            'pinata_api_key': pinataApiKey,
            'pinata_secret_api_key': pinataSecretApiKey,
        },
    })
    .then((response) => {
        console.log("JSON uploaded successfully", response.data.IpfsHash);
        return {
            success: true,
            pinataUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`
        }
    }).catch((error) => {
        console.log(error);
        return {
            success: false,
            message: error.message,
        };
    });
};

export const GetIpfsUrlFromPinata = (pinataUrl) => {
    if (!pinataUrl) return '';
    
    // Remove ipfs:// prefix if it exists
    let path = pinataUrl.replace('ipfs://', '');
    
    // Choose a reliable IPFS gateway
    return `${path}`;
    // Alternative gateways:
    // return `https://ipfs.io/ipfs/${path}`;
    // return `https://cloudflare-ipfs.com/ipfs/${path}`;
    // return `https://dweb.link/ipfs/${path}`;
};