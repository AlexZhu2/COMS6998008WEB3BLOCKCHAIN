import React, { useState } from 'react';
import { Form, Button, Container } from 'react-bootstrap';
import { pinFileToIPFS, pinJSONToIPFS } from './pinata';
import build from './build';
import 'bootstrap/dist/css/bootstrap.min.css';
const ethers = require('ethers');

function UploadForm() {
    const [image, setImage] = useState(null);
    const [details, setDetails] = useState('');
    const [price, setPrice] = useState('');
    const [name, setName] = useState('');
    const [fileURL, setFileURL] = useState('');
    const [message, updateMessage] = useState('');

    async function handleImageChange(e) {
        const file = e.target.files[0];
        setImage(file);

        try {
            const result = await pinFileToIPFS(file);
            if (result.success) {
                console.log("Image pinned successfully", result.pinataUrl);
                setFileURL(result.pinataUrl);
            } else {
                console.log("Error pinning image", result.message);
                updateMessage("Error uploading image: " + result.message);
            }
        } catch (error) {
            console.error("Upload error:", error);
            updateMessage("Error uploading image: " + error.message);
        }
    }
    async function uploadMetadataToIPFS() {
        try {
            if (!image || !name || !details || !price) {
                throw new Error("Please fill in all fields");
            }
            const metadata = {
                name: name,
                details: details,
                price: price,
                image: fileURL
            }
            const result = await pinJSONToIPFS(metadata);
            if (result.success) {
                console.log("Metadata pinned successfully", result.pinataUrl);
                return result.pinataUrl;
            } else {
                console.log("Error pinning metadata", result.message);
                throw new Error("Error pinning metadata: " + result.message);
            }
        } catch (error) {
            console.error("Upload metadata error:", error);
            updateMessage("Error uploading metadata: " + error.message);
        }
    }
    async function handleSubmit(e) {
        e.preventDefault();
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
            const metadata = await uploadMetadataToIPFS(name, details, parsedPrice, fileURL);

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
            setFileURL("");
            window.location.reload("/");
        } catch (error) {
            console.error("Error:", error);
            updateMessage("Error: " + error.message);
        }
    }

    return (
        <Container className="mt-5">
            <h2>Upload Product</h2>
            <Form onSubmit={handleSubmit}>

                {/* Image Upload Field */}
                <Form.Group controlId="formFile" className="mb-3">
                    <Form.Label>Upload Image</Form.Label>
                    <Form.Control type="file" accept="image/*" onChange={handleImageChange} />
                </Form.Group>

                <Form.Group controlId="formProductName" className="mb-3">
                    <Form.Label>Product Name</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter product name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </Form.Group>
                {/* Product Detail Field */}
                <Form.Group controlId="formProductDetail" className="mb-3">
                    <Form.Label>Product Detail</Form.Label>
                    <Form.Control
                        type="text"
                        placeholder="Enter product details"
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                    />
                </Form.Group>

                {/* Product Price Field */}
                <Form.Group controlId="formProductPrice" className="mb-3">
                    <Form.Label>Product Price</Form.Label>
                    <Form.Control
                        type="number"
                        placeholder="Enter product price"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </Form.Group>

                {/* Submit Button */}
                <Button variant="primary" type="submit">
                    Upload Product
                </Button>
            </Form>
        </Container>
    );
}

export default UploadForm;
