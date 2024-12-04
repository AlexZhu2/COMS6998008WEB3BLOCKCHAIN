import React, { useState } from 'react';
import { Form, Button, Container, Card, Spinner } from 'react-bootstrap';
import { pinFileToIPFS, pinJSONToIPFS } from './pinata';
import build from './build';
import 'bootstrap/dist/css/bootstrap.min.css';
import './upload.css';
const ethers = require('ethers');

function UploadForm() {
    const [image, setImage] = useState(null);
    const [details, setDetails] = useState('');
    const [price, setPrice] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [fileURL, setFileURL] = useState('');
    const [message, updateMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); 

    async function handleImageChange(e) {
        const file = e.target.files[0];
        setImage(file);

        try {
            // Read and process file content
            const fileInfo = await processFile(file);
            
            // Upload file to IPFS
            const result = await pinFileToIPFS(file);
            
            if (result.success) {
                console.log("File pinned successfully", result.pinataUrl);
                setFileURL(result.pinataUrl);

                // Update form fields with processed file info
                if (fileInfo) {
                    setDetails(fileInfo.preview);
                    if (!name) {
                        setName(fileInfo.title || file.name.replace(/\.[^/.]+$/, ''));
                    }
                    setCategory(fileInfo.category);
                }
            } else {
                console.log("Error pinning file", result.message);
                updateMessage("Error uploading file: " + result.message);
            }
        } catch (error) {
            console.error("Upload error:", error);
            updateMessage("Error uploading file: " + error.message);
        }
    }

    // New function to process different file types
    async function processFile(file) {
        const fileType = file.type || (file.name.endsWith('.md') ? 'text/markdown' : 'text/plain');
        
        // If not a text file, return basic info
        if (!fileType.includes('text/') && !file.name.endsWith('.md')) {
            return {
                type: fileType,
                category: 'visual-arts',
                properties: {
                    size: file.size,
                    lastModified: file.lastModified,
                    mimeType: fileType
                }
            };
        }

        // Read file content
        const content = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });

        // Process content based on file type
        if (fileType === 'text/markdown' || file.name.endsWith('.md')) {
            return processMarkdownFile(content, file);
        } else {
            return processTextFile(content, file);
        }
    }

    function processMarkdownFile(content, file) {
        const lines = content.split('\n');
        let title = file.name.replace(/\.[^/.]+$/, '');
        let preview = '';
        
        // Try to extract title from markdown
        if (lines[0] && lines[0].startsWith('# ')) {
            title = lines[0].substring(2).trim();
            lines.shift(); // Remove title line
        }

        // Process markdown content
        preview = lines.join('\n').trim();

        return {
            type: 'text/markdown',
            category: 'poems',
            title,
            preview: preview.slice(0, 500) + (preview.length > 500 ? '...' : ''),
            properties: {
                size: file.size,
                lastModified: file.lastModified,
                wordCount: content.split(/\s+/).length,
                lineCount: lines.length,
                format: 'markdown',
                fullContent: content,
                contentPreview: preview.slice(0, 1000),
                structure: {
                    hasTitle: lines[0]?.startsWith('# '),
                    paragraphs: content.split('\n\n').length
                }
            }
        };
    }

    function processTextFile(content, file) {
        const lines = content.split('\n');
        let title = file.name.replace(/\.[^/.]+$/, '');
        
        // Try to extract title from first line
        if (lines[0] && lines[0].trim()) {
            title = lines[0].trim();
            lines.shift(); // Remove title line
        }

        const preview = lines.join('\n').trim();

        return {
            type: 'text/plain',
            category: 'poems',
            title,
            preview: preview.slice(0, 500) + (preview.length > 500 ? '...' : ''),
            properties: {
                size: file.size,
                lastModified: file.lastModified,
                wordCount: content.split(/\s+/).length,
                lineCount: lines.length,
                format: 'plain',
                fullContent: content,
                contentPreview: preview.slice(0, 1000),
                structure: {
                    hasTitle: lines.length > 0,
                    paragraphs: content.split('\n\n').length
                }
            }
        };
    }

    async function uploadMetadataToIPFS() {
        try {
            if (!image || !name || !category || !details || !price) {
                throw new Error("Please fill in all fields");
            }

            // Process file again to get full info
            const fileInfo = await processFile(image);

            const metadata = {
                name,
                category,
                description: details,
                price,
                image: fileURL,
                fileType: fileInfo.type,
                properties: fileInfo.properties,
                attributes: [
                    {
                        trait_type: "Category",
                        value: category
                    },
                    {
                        trait_type: "File Type",
                        value: fileInfo.type
                    },
                    {
                        trait_type: "Word Count",
                        value: fileInfo.properties?.wordCount?.toString() || "N/A"
                    },
                    {
                        trait_type: "Format",
                        value: fileInfo.properties?.format || "N/A"
                    }
                ]
            };

            const result = await pinJSONToIPFS(metadata);
            if (result.success) {
                console.log("Metadata pinned successfully", result.pinataUrl);
                return result.pinataUrl;
            } else {
                throw new Error("Error pinning metadata: " + result.message);
            }
        } catch (error) {
            console.error("Upload metadata error:", error);
            updateMessage("Error uploading metadata: " + error.message);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!window.ethereum) {
                throw new Error("Please install MetaMask to use this feature");
            }

            if (!build.address || !build.abi) {
                console.error("Contract details:", {
                    address: build.address,
                    abi: build.abi
                });
                throw new Error("Contract details are not available");
            }

            const parsedPrice = ethers.parseUnits(price.toString(), 'ether');
            const metadata = await uploadMetadataToIPFS(name, category, details, parsedPrice, fileURL);

            // Get provider and signer
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();  // Make sure to await the signer

            // Create contract with signer
            const contract = new ethers.Contract(
                build.address,
                build.abi,
                signer  // Pass the resolved signer
            );

            let listingPrice = await contract.getListingPrice();
            listingPrice = listingPrice.toString();

            console.log("listingPrice", listingPrice);
            console.log("parsedPrice", parsedPrice);
            console.log("metadata", metadata);

            const transaction = await contract.createToken(metadata, parsedPrice, { value: listingPrice });
            updateMessage("Product uploaded successfully, waiting for confirmation...");
            await transaction.wait();
            updateMessage("Product uploaded successfully");
            alert("Product uploaded successfully");
            updateMessage("");
            setImage(null);
            setDetails("");
            setPrice("");
            setName("");
            setCategory("");
            setFileURL("");
            window.location.reload("/");
        } catch (error) {
            console.error("Error:", error);
            updateMessage("Error: " + error.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Container className="upload-page mt-5">
            <Card className="upload-card p-4">
                <h2 className="text-center upload-title">Upload Artwork</h2>
                <p className="text-center upload-subtitle">
                    Provide the details for your NFT listing.
                </p>
                <Form onSubmit={handleSubmit} className="mt-4">

                    {/* Image Upload Field */}
                    <Form.Group controlId="formFile" className="mb-3">
                        <Form.Label className="upload-label">File Upload</Form.Label>
                        <Form.Control 
                            type="file" 
                            accept="image/*,.txt,.md,.pdf" 
                            onChange={handleImageChange} 
                            className="upload-input"
                        />
                        <Form.Text className="text-muted">
                            Supported formats: Images, .txt, .md, .pdf
                        </Form.Text>
                    </Form.Group>

                    {/* Artwork Name */}
                    <Form.Group controlId="formProductName" className="mb-3">
                        <Form.Label className="upload-label">Name</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Enter artwork name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="upload-input"
                        />
                    </Form.Group>

                    {/* Artwork Category */}
                    <Form.Group controlId="formProductCategory" className="mb-3">
                        <Form.Label className="upload-label">Category</Form.Label>
                        <Form.Control 
                            as="select"
                            value={category}
                            onChange={(e) => {
                                const selectedValue = e.target.value;
                                if (selectedValue !== "") {
                                    setCategory(selectedValue);
                                }
                            }}
                            className="upload-input"
                        >
                            <option value="">Please Select</option>
                            <option value="visual-arts">Visual Arts</option>
                            <option value="poems">Poems</option>
                        </Form.Control>
                    </Form.Group>

                    {/* Artwork Description */}
                    <Form.Group controlId="formProductDetail" className="mb-3">
                        <Form.Label className="upload-label">Description</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Describe your artwork"
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                            className="upload-input"
                        />
                    </Form.Group>

                    {/* Artwork Price */}
                    <Form.Group controlId="formProductPrice" className="mb-3">
                        <Form.Label className="upload-label">Price (ETH)</Form.Label>
                        <Form.Control
                            type="number"
                            placeholder="Enter price in ETH"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="upload-input"
                        />
                    </Form.Group>

                    {/* Submit Button */}
                    <div className="text-center">
                        <Button variant="primary" type="submit" className="upload-button" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                    />
                                    {' '}Uploading...
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </div>
                </Form>
            </Card>
        </Container>
    );

}

export default UploadForm;
