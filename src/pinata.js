import axios from 'axios';
import build from './build';
const pinataSecretApiKey = build.REACT_APP_PINATA_SECRET;
const pinataApiKey = build.REACT_APP_PINATA_KEY;
const formData = require('form-data');

export const pinFileToIPFS = async (file) => {
    const uploadTask = async () => {
        try {
            if (!file) throw new Error('No file provided');
            if (!pinataApiKey || !pinataSecretApiKey) throw new Error('Pinata API keys not configured');

            // Read file content for text files
            let fileContent = null;
            let fileType = file.type;
            
            // Handle different text-based file types
            if (file.type === 'text/plain' || 
                file.name.endsWith('.txt') || 
                file.name.endsWith('.md') || 
                file.type === 'text/markdown') {
                
                fileContent = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = (e) => reject(e);
                    reader.readAsText(file);
                });

                // Set proper file type if extension is .md
                if (file.name.endsWith('.md')) {
                    fileType = 'text/markdown';
                }
            }

            const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
            const data = new FormData();
            data.append('file', file);

            // Enhanced metadata for text files
            const metadata = JSON.stringify({
                name: file.name || 'Untitled',
                keyvalues: {
                    type: fileType,
                    size: file.size,
                    lastModified: file.lastModified,
                    uploadedAt: new Date().toISOString()
                }
            });
            data.append('pinataMetadata', metadata);

            // Upload the file first
            const fileResponse = await axios.post(url, data, {
                maxBodyLength: Infinity,
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
                    'pinata_api_key': pinataApiKey,
                    'pinata_secret_api_key': pinataSecretApiKey,
                },
                retry: 3,
                retryDelay: 1000,
            });

            // For text files, create and upload additional metadata
            if (fileContent !== null) {
                const enhancedMetadata = {
                    name: file.name || 'Untitled',
                    description: `Text content from ${file.name}`,
                    image: `https://gateway.pinata.cloud/ipfs/${fileResponse.data.IpfsHash}`,
                    fileType: fileType,
                    content: fileContent.slice(0, 1000), // Store first 1000 characters for preview
                    attributes: [
                        {
                            trait_type: "File Type",
                            value: fileType
                        },
                        {
                            trait_type: "Size",
                            value: `${(file.size / 1024).toFixed(2)} KB`
                        },
                        {
                            trait_type: "Last Modified",
                            value: new Date(file.lastModified).toISOString()
                        }
                    ],
                    properties: {
                        size: file.size,
                        type: fileType,
                        lastModified: file.lastModified,
                        uploadedAt: new Date().toISOString(),
                        originalHash: fileResponse.data.IpfsHash
                    }
                };

                // Upload the enhanced metadata
                const metadataResponse = await pinJSONToIPFS(enhancedMetadata);

                return {
                    success: true,
                    pinataUrl: "ipfs://" + metadataResponse.pinataUrl.replace("ipfs://", ""),
                    ipfsHash: metadataResponse.pinataUrl.replace("ipfs://", ""),
                    timestamp: new Date().toISOString(),
                    fileInfo: {
                        name: file.name,
                        size: file.size,
                        type: fileType,
                        content: fileContent.slice(0, 100) + "..." // Preview
                    }
                };
            }

            // Return regular response for non-text files
            return {
                success: true,
                pinataUrl: `https://gateway.pinata.cloud/ipfs/${fileResponse.data.IpfsHash}`,
                ipfsHash: fileResponse.data.IpfsHash,
                timestamp: new Date().toISOString(),
                fileInfo: {
                    name: file.name,
                    size: file.size,
                    type: fileType
                }
            };
        } catch (error) {
            console.error('Error uploading file to Pinata:', error);
            return {
                success: false,
                message: error.message,
                timestamp: new Date().toISOString(),
                details: error.response?.data || error
            };
        }
    };

    return rateLimiter.addTask(uploadTask);
};

export const pinJSONToIPFS = async (JSONBody) => {
    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    // Enhance the metadata with formatted category and additional attributes
    const enhancedJSON = {
        ...JSONBody,
        attributes: [
            {
                trait_type: "Category",
                value: JSONBody.category === "visual-arts" ? "Visual Arts" : "Poems"
            },
            {
                trait_type: "Upload Date",
                value: new Date().toISOString()
            }
        ]
    };

    try {
        const response = await axios.post(url, enhancedJSON, {
            headers: {
                'Content-Type': 'application/json',
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            }
        });

        return {
            success: true,
            pinataUrl: "ipfs://" + response.data.IpfsHash,
            message: "Metadata uploaded successfully"
        };
    } catch (error) {
        console.error("Error uploading JSON to Pinata:", error);
        return {
            success: false,
            message: error.message || "Something went wrong uploading the metadata"
        };
    }
};

const rateLimiter = {
    queue: [],
    processing: false,
    
    addTask(task) {
        return new Promise((resolve, reject) => {
            this.queue.push({
                fn: task,
                resolve,
                reject
            });
            this.process();
        });
    },

    async process() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;
        
        const task = this.queue.shift();
        try {
            const result = await task.fn();
            task.resolve(result);
        } catch (error) {
            task.reject(error);
        }
        
        this.processing = false;
        setTimeout(() => this.process(), 1000);
    }
};

const IPFS_GATEWAYS = {
    pinata: 'https://gateway.pinata.cloud/ipfs/',
    ipfs: 'https://ipfs.io/ipfs/',
    cloudflare: 'https://cloudflare-ipfs.com/ipfs/',
    dweb: 'https://dweb.link/ipfs/'
};

export const GetIpfsUrlFromPinata = (pinataUrl, gateway = 'pinata') => {
    if (!pinataUrl) return '';
    
    const path = pinataUrl.replace('ipfs://', '');
    const selectedGateway = IPFS_GATEWAYS[gateway] || IPFS_GATEWAYS.pinata;
    
    if (path.includes('gateway.pinata.cloud') || 
        path.includes('ipfs.io') || 
        path.includes('cloudflare-ipfs.com') || 
        path.includes('dweb.link')) {
        return path;
    }
    
    return `${selectedGateway}${path}`;
};

export const validateIPFSHash = (hash) => {
    const ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[A-Za-z2-7]{58}|B[A-Z2-7]{58}|z[1-9A-HJ-NP-Za-km-z]{48}|F[0-9A-F]{50})$/i;
    return ipfsHashRegex.test(hash);
};

export const checkPinStatus = async (ipfsHash) => {
    try {
        if (!validateIPFSHash(ipfsHash)) {
            throw new Error('Invalid IPFS hash');
        }

        const url = `https://api.pinata.cloud/pinning/pinJobs?ipfs_pin_hash=${ipfsHash}`;
        const response = await axios.get(url, {
            headers: {
                'pinata_api_key': pinataApiKey,
                'pinata_secret_api_key': pinataSecretApiKey,
            }
        });

        return {
            success: true,
            status: response.data.rows[0]?.status || 'unknown',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            success: false,
            message: error.message,
            timestamp: new Date().toISOString()
        };
    }
};