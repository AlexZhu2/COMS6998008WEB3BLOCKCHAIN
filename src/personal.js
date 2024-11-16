import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { ethers } from 'ethers';
import NFTTile from './NFTcard';
import build from './build.json';

function Personal() {
    const [userNFTs, setUserNFTs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadUserNFTs = async () => {
            try {
                setLoading(true);
                setError(null);

                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();

                // Create contract instance
                const contract = new ethers.Contract(build.address, build.abi, provider);

                // Get user's NFTs directly from contract
                const nfts = await contract.getTokensOfOwner(address);
                console.log("NFTs from contract:", nfts);

                // Transform the contract data into our frontend format
                const transformedNFTs = nfts.map(nft => ({
                    tokenId: Number(nft.tokenId),
                    seller: nft.seller,
                    owner: nft.owner,
                    price: ethers.formatEther(nft.price),
                    sold: nft.sold
                }));
                console.log("Transformed NFTs:", transformedNFTs);
                // Fetch metadata for each NFT
                const nftsWithMetadata = await Promise.all(
                    transformedNFTs.map(async (nft) => {
                        try {
                            const tokenURI = await contract.tokenURI(nft.tokenId);
                            const response = await fetch(tokenURI);
                            const metadata = await response.json();
                            return {
                                ...nft,
                                name: metadata.name,
                                description: metadata.description,
                                image: metadata.image
                            };
                        } catch (error) {
                            console.error(`Error fetching metadata for token ${nft.tokenId}:`, error);
                            return {
                                ...nft,
                                name: `NFT #${nft.tokenId}`,
                                description: 'Metadata unavailable',
                                image: '' // You might want to add a placeholder image URL here
                            };
                        }
                    })
                );

                console.log("Processed NFTs:", nftsWithMetadata);
                setUserNFTs(nftsWithMetadata);
            } catch (error) {
                console.error("Error loading user NFTs:", error);
                setError("Failed to load your NFTs. Please make sure your wallet is connected.");
            } finally {
                setLoading(false);
            }
        };

        loadUserNFTs();
    }, []);

    if (loading) {
        return (
            <Container className="py-5">
                <div className="text-center text-white">
                    <h3>Loading your NFTs...</h3>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <div className="text-center mb-5">
                <h1 className="text-white">My Collection</h1>
                <div className="text-white">
                    View and manage your NFTs
                </div>
            </div>
            
            {userNFTs.length === 0 ? (
                <Card className="bg-dark text-white">
                    <Card.Body className="text-center">
                        <h5>You don't own any NFTs yet ...</h5>
                        <div>Visit the marketplace to purchase your first NFT!</div>
                        <Nav className="justify-content-center mt-3">
                        <Nav.Link as={Link} to="/" className="btn btn-primary" style={{ color: 'green' }}>
                            Go to marketplace →
                        </Nav.Link>
                        </Nav>
                    </Card.Body>
                </Card>
            ) : (
                <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                    {userNFTs.map((nft, idx) => (
                        <Col key={`${nft.tokenId}-${idx}`}>
                            <NFTTile data={nft} />
                        </Col>
                    ))}
                </Row>
            )}
        </Container>
    );
}

export default Personal;