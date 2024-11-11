import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import NFTTile from './NFTcard';

function MarketMain({ nfts }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [displayNFTs, setDisplayNFTs] = useState([]);

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
        <Container className="py-5">
            <h2 className="text-white mb-4">NFT Marketplace</h2>
            <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {displayNFTs.map((nft, idx) => {
                    console.log("nft", nft);
                    return (
                        <Col key={`${nft.tokenId}-${idx}`}>
                            <NFTTile data={nft} />
                        </Col>
                    )
        })}
            </Row>
        </Container>
    );
}

export default MarketMain;