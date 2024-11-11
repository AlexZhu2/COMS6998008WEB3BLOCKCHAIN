import React from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

function NFTTile({ data }) {
    const navigate = useNavigate();

    if (!data || !data.tokenId) {
        return null;
    }

    const handleClick = () => {
        navigate(`/nftPage/${data.tokenId}`);
    };

    const isListed = data.seller?.toLowerCase() !== data.owner?.toLowerCase();

    return (
        <Card 
            className="bg-dark text-white h-100" 
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
        >
            {data.image && (
                <Card.Img 
                    variant="top" 
                    src={data.image}
                    alt={data.name || 'NFT'}
                    style={{ 
                        height: '200px',
                        objectFit: 'contain',
                        backgroundColor: '#1a1a1a'
                    }}
                    className="p-2"
                    crossOrigin="anonymous"
                />
            )}
            <Card.Body>
                <Card.Title>{data.name || 'Unnamed NFT'}</Card.Title>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="text-primary">
                        {data.price} ETH
                    </span>
                    {isListed && (
                        <span className="badge bg-success">
                            Listed
                        </span>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default NFTTile;