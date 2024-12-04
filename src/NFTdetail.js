import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { ethers } from 'ethers';
import build from './build.json';

function NFTDetail({ nfts }) {
    const { tokenId } = useParams();
    const navigate = useNavigate();
    const [isOwner, setIsOwner] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showListModal, setShowListModal] = useState(false);
    const [listingPrice, setListingPrice] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [pastOwners, setPastOwners] = useState([]);
    const [showAllOwners, setShowAllOwners] = useState(false);

    const INITIAL_DISPLAY_COUNT = 3;
    const nft = nfts.find(n => n.tokenId === Number(tokenId));

    const displayedOwners = showAllOwners
        ? pastOwners
        : pastOwners.slice(0, INITIAL_DISPLAY_COUNT);

    const renderOwnerAddress = (address) => {
        if (address === ethers.ZeroAddress) return 'Minted';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    useEffect(() => {
        if (nft && nft.tokenId) {
            const fetchData = async () => {
                try {
                    await checkOwnership();
                    await fetchPastOwners();
                } catch (error) {
                    console.error("Error in useEffect:", error);
                }
            };
            fetchData();
        }
    }, [nft]);

    const fetchPastOwners = useCallback(async () => {
        if (!nft || !tokenId) return;
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contract = new ethers.Contract(build.address, build.abi, provider);
            
            const filter = contract.filters.Transfer(null, null, tokenId);
            const events = await contract.queryFilter(filter);
            
            const processedOwners = await Promise.all(events.map(async (event, index) => {
                try {
                    const block = await event.getBlock();
                    return {
                        // Create a unique key using multiple values
                        id: `${event.transactionHash}-${event.logIndex}-${index}`,
                        from: event.args[0],
                        to: event.args[1],
                        timestamp: new Date(block.timestamp * 1000).toLocaleDateString(),
                        txHash: event.transactionHash,
                        blockNumber: block.number
                    };
                } catch (err) {
                    console.error("Error processing event:", err);
                    return null;
                }
            }));
            
            // Filter out any null entries and sort by block number
            const validOwners = processedOwners
                .filter(owner => owner !== null)
                .sort((a, b) => b.blockNumber - a.blockNumber);
            
            setPastOwners(validOwners);
        } catch (error) {
            console.error("Error fetching past owners:", error);
            setPastOwners([]);
        }
    }, [nft, tokenId]);

    const checkOwnership = useCallback(async () => {
        if (!nft) return;
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            
            // User owns the NFT if they are either the seller or the owner
            const isOwnerResult = userAddress.toLowerCase() === nft.owner.toLowerCase() || 
                                userAddress.toLowerCase() === nft.seller.toLowerCase();
            
            console.log("Ownership check:", { 
                userAddress, 
                owner: nft.owner, 
                seller: nft.seller, 
                isOwner: isOwnerResult 
            });
            
            setIsOwner(isOwnerResult);
        } catch (error) {
            console.error("Error checking ownership:", error);
            setIsOwner(false);
        }
    }, [nft]);

    const getTokenInfo = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(build.address, build.abi, signer);

        // Get the current token data from contract
        const listedToken = await contract.getListedTokenForId(nft.tokenId);
        return listedToken;
    }

    const handlePurchase = async () => {
        try {
            setIsProcessing(true);
            setError(null);

            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const userAddress = await signer.getAddress();
            const contract = new ethers.Contract(build.address, build.abi, signer);

            // Get the current token data from contract
            const listedToken = await contract.getListedTokenForId(nft.tokenId);
            const priceInWei = listedToken.price;

            // Add pre-purchase checks
            console.log("Pre-purchase checks:", {
                tokenId: nft.tokenId,
                contractPrice: priceInWei.toString(),
                seller: listedToken.seller,
                owner: listedToken.owner,
                buyer: userAddress,
                isSold: listedToken.sold
            });

            // Verify the token is actually for sale
            if (listedToken.sold) {
                setError("This NFT is no longer available for purchase");
                return;
            }

            // Verify user is not the seller
            if (listedToken.seller.toLowerCase() === userAddress.toLowerCase()) {
                setError("You cannot purchase your own NFT");
                return;
            }

            // Check user's balance
            const balance = await provider.getBalance(userAddress);
            if (balance < priceInWei) {
                setError("Insufficient funds to complete the purchase");
                return;
            }

            // Estimate gas first
            try {
                const gasEstimate = await contract.executeSale.estimateGas(
                    nft.tokenId,
                    { value: priceInWei }
                );
                console.log("Estimated gas:", gasEstimate.toString());
            } catch (gasError) {
                console.error("Gas estimation failed:", gasError);
                setError("Transaction would fail. Please check the NFT's status.");
                return;
            }

            console.log("Executing purchase with:", {
                tokenId: nft.tokenId,
                value: priceInWei.toString(),
                gasLimit: 300000
            });

            // Execute the sale
            const transaction = await contract.executeSale(
                nft.tokenId,
                { 
                    value: priceInWei,  // Use exact price from contract
                    gasLimit: 3000000    // Add explicit gas limit
                }
            );

            setSuccess("Transaction submitted. Waiting for confirmation...");
            
            const receipt = await transaction.wait();
            console.log("Transaction receipt:", receipt);

            setSuccess("NFT successfully purchased!");
            
            // Reload the page after 2 seconds
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Purchase error:", error);
            
            // More detailed error handling
            if (error.message.includes("user rejected")) {
                setError("Transaction was rejected by user");
            } else if (error.message.includes("insufficient funds")) {
                setError("Insufficient funds to complete the purchase");
            } else if (error.message.includes("asking price")) {
                setError("Please submit the exact asking price");
            } else if (error.receipt) {
                // If we have a receipt, the transaction was mined but failed
                setError("Transaction failed on-chain. The NFT might no longer be available.");
            } else {
                setError("Error purchasing NFT. Please try again.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleListForSale = async () => {
        if (!listingPrice || isNaN(listingPrice) || listingPrice <= 0) {
            setError("Please enter a valid price");
            return;
        }

        setIsProcessing(true);
        setError(null);
        
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(build.address, build.abi, signer);

            // Convert price to wei
            const priceInWei = ethers.parseEther(listingPrice.toString());

            // First approve the marketplace contract if not already approved
            const isApproved = await contract.isApprovedForAll(nft.owner, build.address);
            if (!isApproved) {
                console.log("Approving marketplace...");
                const approveTx = await contract.setApprovalForAll(build.address, true);
                await approveTx.wait();
                console.log("Marketplace approved");
            }

            console.log("Listing NFT...");
            // List the token for sale
            const transaction = await contract.resellToken(nft.tokenId, priceInWei);
            setSuccess("Transaction submitted. Waiting for confirmation...");
            
            await transaction.wait();
            setSuccess("NFT successfully listed for sale!");
            setShowListModal(false);
            
            // Reload the page after 2 seconds to show updated state
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Listing error:", error);
            setError(error.message || "Error listing NFT. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    const listedToken = getTokenInfo();
    //const isNFTOnSale = nft?.seller.toLowerCase() !== nft?.owner.toLowerCase();
    const isNFTOnSale = listedToken.sold === false && listedToken.seller !== listedToken.buyer;
    console.log("isNFTOnSale:", isNFTOnSale);

    const ButtonContent = () => {
        if (isProcessing) {
            return (
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
            );
        }

        console.log("isNFTOnSale:", isNFTOnSale);

        // If NFT is already on sale
        if (isNFTOnSale) {
            if (isOwner) {
                return "Already Listed";
            }
            return "Purchase Now";
        }

        // If user is owner and NFT is not on sale
        if (isOwner) {
            return "List for Sale";
        }

        return "Not For Sale";
    };

    const handleButtonClick = () => {
        // If NFT is on sale and user is not owner
        if (isNFTOnSale && !isOwner) {
            handlePurchase();
            return;
        }

        // If user is owner and NFT is not on sale
        if (isOwner && !isNFTOnSale) {
            setShowListModal(true);
            return;
        }
    };

    console.log("NFT Data:", nft);
    console.log("Is Owner:", isOwner);

    if (!nft) {
        return (
            <Container className="py-5">
                <div className="text-center text-white">
                    <h3>NFT not found</h3>
                </div>
            </Container>
        );
    }

    return (
        <Container className="py-5">
            <Button
                variant="outline-light"
                className="mb-4"
                onClick={() => navigate(-1)}
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
                    {/* Title, Price, and Action Button */}
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
                                    variant={getButtonVariant()}
                                    size="lg" 
                                    className="w-100"
                                    onClick={handleButtonClick}
                                    disabled={
                                        isProcessing || 
                                        (isNFTOnSale && isOwner) || // Owner can't purchase their own NFT
                                        (!isOwner && !isNFTOnSale)  // Non-owners can't interact with unlisted NFTs
                                    }
                                >
                                    <ButtonContent />
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    {/* Description */}
                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Description</h4>
                            <p className="mb-0">
                                {nft.description}
                            </p>
                        </Card.Body>
                    </Card>

                    {/* Ownership History */}
                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Ownership History</h4>
                            {pastOwners.length > 0 ? (
                                <>
                                    {displayedOwners.map((owner, index) => (
                                        <div 
                                            // Use multiple values to ensure uniqueness
                                            key={`${owner.id}-${index}`}
                                            className={`mb-3 ${
                                                index !== displayedOwners.length - 1 
                                                    ? 'pb-3 border-bottom border-secondary' 
                                                    : ''
                                            }`}
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

            {/* List for Sale Modal */}
            <Modal
                show={showListModal}
                onHide={() => {
                    setShowListModal(false);
                    setListingPrice('');
                    setError(null);
                }}
                centered
                className="text-dark"
            >
                <Modal.Header closeButton>
                    <Modal.Title>List NFT for Sale</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={(e) => {
                        e.preventDefault();
                        handleListForSale();
                    }}>
                        <Form.Group className="mb-3">
                            <Form.Label>Price (ETH)</Form.Label>
                            <Form.Control
                                type="number"
                                placeholder="Enter price in ETH"
                                value={listingPrice}
                                onChange={(e) => setListingPrice(e.target.value)}
                                step="0.001"
                                min="0"
                                required
                            />
                            <Form.Text className="text-muted">
                                Set the price in ETH for your NFT
                            </Form.Text>
                        </Form.Group>
                    </Form>
                    {error && (
                        <Alert variant="danger" className="mt-3">
                            {error}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button 
                        variant="secondary" 
                        onClick={() => {
                            setShowListModal(false);
                            setListingPrice('');
                            setError(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="primary" 
                        onClick={handleListForSale}
                        disabled={isProcessing || !listingPrice || isNaN(listingPrice) || listingPrice <= 0}
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
                                Listing...
                            </>
                        ) : (
                            'List for Sale'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );

    // Helper function to determine button variant
    function getButtonVariant() {
        if (isProcessing) return "secondary";
        if (isNFTOnSale) {
            if (isOwner) return "secondary"; // Already listed
            return "primary"; // Available for purchase
        }
        if (isOwner) return "primary"; // Available to list
        return "secondary"; // Not for sale
    }
}

export default NFTDetail; 