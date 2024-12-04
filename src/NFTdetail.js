import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { ethers } from 'ethers';
import build from './build.json';
import { GetIpfsUrlFromPinata } from './pinata';
import './NFTdetail.css';
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
    const [isNFTOnSale, setIsNFTOnSale] = useState(false);
    const [swappedOwners, setSwappedOwners] = useState([]);
    const [metadata, setMetadata] = useState(null);
    const [loadingMetadata, setLoadingMetadata] = useState(true);

    const INITIAL_DISPLAY_COUNT = 3;
    const nft = nfts.find(n => n.tokenId === Number(tokenId));
    console.log("NFT Data:", nft);

    const displayedOwners = showAllOwners
        ? swappedOwners
        : swappedOwners.slice(0, INITIAL_DISPLAY_COUNT);

    const renderOwnerAddress = (address) => {
        if (address === ethers.ZeroAddress) return 'Minted';
        return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    };

    useEffect(() => {
        if (pastOwners.length > 1) {
            console.log("Before swap:", pastOwners);
            const tempOwner = [...pastOwners];
            const temp = tempOwner[tempOwner.length - 1];
            tempOwner[tempOwner.length - 1] = tempOwner[tempOwner.length - 2];
            tempOwner[tempOwner.length - 2] = temp;
            console.log("After swap:", tempOwner);
            setSwappedOwners(tempOwner);
        } else {
            setSwappedOwners(pastOwners);
        }
    }, [pastOwners]);

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

    useEffect(() => {
        const fetchMetadata = async () => {
            if (!nft || !nft.tokenId) return;
            
            try {
                setLoadingMetadata(true);
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(build.address, build.abi, provider);
                
                const tokenURI = await contract.tokenURI(nft.tokenId);
                console.log("Token URI:", tokenURI);
                
                const httpUrl = GetIpfsUrlFromPinata(tokenURI);
                const response = await fetch(httpUrl);
                if (!response.ok) throw new Error('Failed to fetch metadata');
                
                const data = await response.json();
                console.log("Metadata:", data);
                
                if (data.image) {
                    data.image = GetIpfsUrlFromPinata(data.image);
                }
                
                setMetadata(data);
            } catch (err) {
                console.error("Error fetching metadata:", err);
                setError("Failed to load NFT metadata: " + err.message);
            } finally {
                setLoadingMetadata(false);
            }
        };

        fetchMetadata();
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

        const listedToken = await contract.getListedTokenForId(nft.tokenId);
        console.log("listedToken:", listedToken);
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

            const listedToken = await contract.getListedTokenForId(nft.tokenId);
            const priceInWei = listedToken.price;

            console.log("Pre-purchase checks:", {
                tokenId: nft.tokenId,
                contractPrice: priceInWei.toString(),
                seller: listedToken.seller,
                owner: listedToken.owner,
                buyer: userAddress,
                isSold: listedToken.sold
            });

            if (listedToken.sold) {
                setError("This NFT is no longer available for purchase");
                return;
            }

            if (listedToken.seller.toLowerCase() === userAddress.toLowerCase()) {
                setError("You cannot purchase your own NFT");
                return;
            }

            const balance = await provider.getBalance(userAddress);
            if (balance < priceInWei) {
                setError("Insufficient funds to complete the purchase");
                return;
            }

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

            const transaction = await contract.executeSale(
                nft.tokenId,
                { 
                    value: priceInWei, 
                    gasLimit: 3000000   
                }
            );

            setSuccess("Transaction submitted. Waiting for confirmation...");
            
            const receipt = await transaction.wait();
            console.log("Transaction receipt:", receipt);

            setSuccess("NFT successfully purchased!");
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error("Purchase error:", error);
            
            if (error.message.includes("user rejected")) {
                setError("Transaction was rejected by user");
            } else if (error.message.includes("insufficient funds")) {
                setError("Insufficient funds to complete the purchase");
            } else if (error.message.includes("asking price")) {
                setError("Please submit the exact asking price");
            } else if (error.receipt) {
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

            const priceInWei = ethers.parseEther(listingPrice.toString());

            const isApproved = await contract.isApprovedForAll(nft.owner, build.address);
            if (!isApproved) {
                console.log("Approving marketplace...");
                const approveTx = await contract.setApprovalForAll(build.address, true);
                await approveTx.wait();
                console.log("Marketplace approved");
            }

            console.log("Listing NFT...");
            const transaction = await contract.resellToken(nft.tokenId, priceInWei);
            setSuccess("Transaction submitted. Waiting for confirmation...");
            
            await transaction.wait();
            setSuccess("NFT successfully listed for sale!");
            setShowListModal(false);
            
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

    useEffect(() => {
        const updateSaleStatus = async () => {
            const listedToken = await getTokenInfo();
            setIsNFTOnSale(listedToken.sold === false && listedToken.seller !== listedToken.buyer);
        };
        
        if (nft) {
            updateSaleStatus();
        }
    }, [nft]);

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

        if (isNFTOnSale) {
            if (isOwner) {
                return "Already Listed";
            }
            return "Purchase Now";
        }

        if (isOwner) {
            return "List for Sale";
        }

        return "Not For Sale";
    };

    const handleButtonClick = () => {
        if (isNFTOnSale && !isOwner) {
            handlePurchase();
            return;
        }

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
                <Col md={6}>
                    <Card className="bg-light h-100">
                        {metadata?.fileType?.includes('text/') ? (
                            <Card.Body className="text-content-container">
                                <div className="text-center mb-4">
                                    <i className="fas fa-file-alt text-primary" 
                                       style={{ fontSize: '48px' }}>
                                    </i>
                                    <h3 className="mt-3 text-dark">{metadata?.name || nft.name}</h3>
                                </div>
                                <div className="text-content">
                                    {metadata?.properties?.fullContent || 
                                     metadata?.content || 
                                     metadata?.properties?.contentPreview || 
                                     'No content available'}
                                </div>
                                {metadata?.properties && (
                                    <div className="text-info mt-3">
                                        <small>
                                            Words: {metadata.properties.wordCount || 'N/A'} | 
                                            Lines: {metadata.properties.lineCount || 'N/A'}
                                        </small>
                                    </div>
                                )}
                            </Card.Body>
                        ) : metadata?.category === "poems" ? (
                            <Card.Body className="d-flex align-items-center justify-content-center">
                                <div className="text-center">
                                    <i className="fas fa-book-open mb-3" style={{ fontSize: '48px' }}></i>
                                    <h3>{metadata?.name || nft.name}</h3>
                                </div>
                            </Card.Body>
                        ) : (
                            <div className="detail-image-container">
                                <img
                                    src={metadata?.image || nft.image}
                                    alt={metadata?.name || nft.name}
                                    className="detail-image"
                                    crossOrigin="anonymous"
                                />
                            </div>
                        )}
                    </Card>
                </Col>

                <Col md={6}>
                    <Card className="bg-dark text-white">
                        <Card.Body>
                            <h1 className="mb-3">{metadata?.name || nft.name}</h1>
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
                                        (isNFTOnSale && isOwner) || 
                                        (!isOwner && !isNFTOnSale)
                                    }
                                >
                                    <ButtonContent />
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>

                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Description</h4>
                            <p className="mb-0">
                                {metadata?.description || nft.description}
                            </p>
                        </Card.Body>
                    </Card>

                    {metadata?.category === "poems" && metadata?.poem && (
                        <Card className="bg-dark text-white mt-4">
                            <Card.Body>
                                <h4 className="mb-3">Poem</h4>
                                <div className="poem-content" style={{ 
                                    whiteSpace: 'pre-line',
                                    fontFamily: 'Georgia, serif',
                                    lineHeight: '1.6'
                                }}>
                                    {metadata.poem}
                                </div>
                            </Card.Body>
                        </Card>
                    )}

                    <Card className="bg-dark text-white mt-4">
                        <Card.Body>
                            <h4 className="mb-3">Ownership History</h4>
                            {pastOwners.length > 0 ? (
                                <>
                                    {displayedOwners.map((owner, index) => (
                                        <div 
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

    function getButtonVariant() {
        if (isProcessing) return "secondary";
        if (isNFTOnSale) {
            if (isOwner) return "secondary";
            return "primary";
        }
        if (isOwner) return "primary";
        return "secondary";
    }
}

export default NFTDetail; 