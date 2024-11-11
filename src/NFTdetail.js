import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { ethers } from 'ethers';
import build from './build.json';

function NFTDetail({ nfts }) {
    const { tokenId } = useParams();
    const navigate = useNavigate();
    const [pastOwners, setPastOwners] = useState([]);
    const [showAllOwners, setShowAllOwners] = useState(false);
    const nft = nfts.find(n => n.tokenId === Number(tokenId));
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Number of owners to show initially
    const INITIAL_DISPLAY_COUNT = 3;

    useEffect(() => {
        fetchPastOwners();
    }, [tokenId]);

    const fetchPastOwners = async () => {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(build.address, build.abi, provider);

            const filter = contract.filters.Transfer(null, null, tokenId);
            const events = await contract.queryFilter(filter);

            const owners = await Promise.all(events.map(async (event) => {
                const block = await event.getBlock();
                return {
                    from: event.args[0],
                    to: event.args[1],
                    timestamp: new Date(block.timestamp * 1000).toLocaleDateString(),
                    txHash: event.transactionHash
                };
            }));

            // Sort by most recent first
            owners.reverse();
            setPastOwners(owners);
        } catch (error) {
            console.error("Error fetching past owners:", error);
        }
    };

    const renderOwnerAddress = (address) => {
        if (address === ethers.ZeroAddress) return 'Minted';
        // Truncate address for display
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    const displayedOwners = showAllOwners 
        ? pastOwners 
        : pastOwners.slice(0, INITIAL_DISPLAY_COUNT);

    const handlePurchase = async () => {
        setIsProcessing(true);
        setError(null);
        setSuccess(null);

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(build.address, build.abi, signer);

            // Convert price to wei
            const priceInWei = ethers.parseEther(nft.price.toString());

            // Create transaction
            const transaction = await contract.executeSale(nft.tokenId, {
                value: priceInWei
            });

            setSuccess("Transaction submitted. Waiting for confirmation...");

            // Wait for transaction to be mined
            await transaction.wait();
            
            setSuccess("Purchase successful! Redirecting to marketplace...");
            
            // Wait 2 seconds before redirecting
            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (error) {
            console.error("Purchase error:", error);
            setError(error.message || "Error during purchase. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Container className="py-5">
            <Button 
                variant="outline-light" 
                className="mb-4"
                onClick={() => navigate('/')}
            >
                ← Back to Marketplace
            </Button>

            {error && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" className="mb-4">
                    {success}
                </Alert>
            )}

            <Row>
                {/* Left Side - Image */}
                <Col md={6}>
                    <Card className="bg-dark h-100">
                        <Card.Img 
                            src={nft.image} 
                            alt={nft.name}
                            style={{ 
                                width: '100%',
                                height: '100%',
                                maxHeight: '500px',
                                objectFit: 'contain',
                                backgroundColor: '#1a1a1a'
                            }}
                            className="p-3"
                            crossOrigin="anonymous"
                        />
                    </Card>
                </Col>
                
                {/* Right Side - Info */}
                <Col md={6}>
                    <Card className="bg-dark text-white">
                        <Card.Body>
                            <h1 className="mb-3">{nft.name}</h1>
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h3 className="text-primary mb-0">
                                        {nft.price} ETH
                                    </h3>
                                    <small className="text-muted">
                                        Token ID: {nft.tokenId}
                                    </small>
                                </div>
                                <Button 
                                    variant="primary" 
                                    size="lg" 
                                    className="w-100"
                                    onClick={handlePurchase}
                                    disabled={isProcessing || nft.seller.toLowerCase() === nft.owner.toLowerCase()}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Spinner
                                                as="span"
                                                animation="border"
                                                size="sm"
                                                role="status"
                                                aria-hidden="true"
                                                className="me-2"
                                            />
                                            Processing...
                                        </>
                                    ) : nft.seller.toLowerCase() === nft.owner.toLowerCase() ? (
                                        'Not For Sale'
                                    ) : (
                                        'Purchase Now'
                                    )}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Description</h4>
                            <p className="mb-0">
                                {nft.description}
                            </p>
                        </Card.Body>
                    </Card>

                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Ownership History</h4>
                            {pastOwners.length > 0 ? (
                                <>
                                    {displayedOwners.map((owner, index) => (
                                        <div 
                                            key={owner.txHash} 
                                            className={`mb-3 ${index !== displayedOwners.length - 1 ? 'pb-3 border-bottom border-secondary' : ''}`}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <div className="d-flex align-items-center">
                                                    <div className="me-2">
                                                        <span className="text-muted">From: </span>
                                                        <span className="text-break">
                                                            {renderOwnerAddress(owner.from)}
                                                        </span>
                                                    </div>
                                                    <div className="text-muted mx-2">→</div>
                                                    <div>
                                                        <span className="text-muted">To: </span>
                                                        <span className="text-break">
                                                            {renderOwnerAddress(owner.to)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <small className="text-muted ms-2">
                                                    {owner.timestamp}
                                                </small>
                                            </div>
                                            <div className="small text-muted">
                                                <a 
                                                    href={`https://sepolia.etherscan.io/tx/${owner.txHash}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-primary text-decoration-none"
                                                >
                                                    View Transaction ↗
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {pastOwners.length > INITIAL_DISPLAY_COUNT && (
                                        <div className="text-center mt-3">
                                            <Button 
                                                variant="outline-light" 
                                                size="sm"
                                                onClick={() => setShowAllOwners(!showAllOwners)}
                                            >
                                                {showAllOwners ? 'Show Less' : `Show All (${pastOwners.length})`}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-muted">No previous transfers found</div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default NFTDetail; 