import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import NFTTile from './NFTcard';
import './marketmain.css';

function MarketMain({ nfts }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayNFTs, setDisplayNFTs] = useState([]);
    const [visualArtsNFTs, setVisualArtsNFTs] = useState([]);
    const [poemNFTs, setPoemNFTs] = useState([]);

    useEffect(() => {
        const loadNFTs = async () => {
            try {
                setLoading(true);
                setError(null);

                // Make sure nfts is an array and has items
                if (!Array.isArray(nfts)) {
                    console.error('NFTs is not an array:', nfts);
                    setError('Unable to load NFTs');
                    return;
                }

                // Filter out any invalid NFTs
                const validNFTs = nfts.filter(nft => 
                    nft && 
                    nft.tokenId !== undefined && 
                    nft.price !== undefined &&
                    nft.seller !== undefined &&
                    nft.owner !== undefined
                );

                setDisplayNFTs(validNFTs);
                setVisualArtsNFTs(validNFTs.filter(nft => nft.category === 'visual-arts'));
                setPoemNFTs(validNFTs.filter(nft => nft.category === 'poems'));
            } catch (error) {
                console.error('Error loading NFTs:', error);
                setError('Error loading NFTs');
            } finally {
                setLoading(false);
            }
        };

        loadNFTs();
    }, [nfts]);

    if (loading) {
        return (
            <Container className="py-5">
                <div className="text-center text-white">
                    <h3>Loading NFTs...</h3>
                </div>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <div className="text-center text-white">
                    <h3>Error: {error}</h3>
                </div>
            </Container>
        );
    }

    if (!displayNFTs.length) {
        return (
            <Container className="py-5">
                <div className="text-center text-white">
                    <h3>No NFTs available</h3>
                </div>
            </Container>
        );
    }

    return (
        <div className="market-main">
          <Container className="py-5">
            <h2 className="text-center market-title fst-italic">
              Welcome to NFT Marketplace
            </h2>
            {displayNFTs.length > 0 && (
                <>
                    <h3 className="text-center market-title">New Release</h3>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {displayNFTs.slice(-4).reverse().map((nft, idx) => (
                            <Col key={`${nft.tokenId}-${idx}`}>
                                <NFTTile data={nft} />
                            </Col>
                        ))}
                    </Row>
                    <div className="text-white">
                    <Nav className="mt-3">
                        <Nav.Link as={Link} to="/displayall" className="btn btn-primary" style={{ color: 'white' }}>
                            View all NFTs →
                        </Nav.Link>
                    </Nav>
                </div>
                    <div className="mt-5" />
                </>
            )}
            <h3 className="text-center market-title">Visual Arts</h3>
            {visualArtsNFTs.length > 0 ? (
                <>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {displayNFTs.map((nft, idx) => (
                            <Col key={`${nft.tokenId}-${idx}`}>
                                <NFTTile data={nft} />
                            </Col>
                        ))}
                    </Row>
                    <div className="mt-5" />
                </>
            ) : (
                <div className="text-white">
                    <h5>Help us make the marketplace better by uploading your art!</h5>
                    <Nav className="mt-3">
                        <Nav.Link as={Link} to="/upload" className="btn btn-primary" style={{ color: 'green' }}>
                            Go uploading →
                        </Nav.Link>
                    </Nav>
                </div>
            )}
            <h3 className="text-center market-title">Poems</h3>
            {poemNFTs.length > 0 ? (
                <>
                    <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                        {displayNFTs.map((nft, idx) => (
                            <Col key={`${nft.tokenId}-${idx}`}>
                                <NFTTile data={nft} />
                            </Col>
                        ))}
                    </Row>
                    <div className="mt-5" />
                </>
            ) : (
                <div className="text-white">
                    <h5>Help us make the marketplace better by uploading your art!</h5>
                    <Nav className="mt-3">
                        <Nav.Link as={Link} to="/upload" className="btn btn-primary" style={{ color: 'green' }}>
                            Go uploading →
                        </Nav.Link>
                    </Nav>
                </div>
            )}
          </Container>
        </div>
      );
}

export default MarketMain;