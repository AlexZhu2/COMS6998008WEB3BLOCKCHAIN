import React from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import build from './build.json';

function NFTTile({ data }) {
    const navigate = useNavigate();

    if (!data || !data.tokenId) {
        return null;
    }

    const getTokenInfo = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(build.address, build.abi, signer);

        // Get the current token data from contract
        const listedToken = await contract.getListedTokenForId(data.tokenId);
        return listedToken;
    };

    const handleClick = () => {
        navigate(`/nftPage/${data.tokenId}`);
    };

    console.log("data", data);
    const listedToken = getTokenInfo();
    const isListed = listedToken.sold === false;

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
                    {isListed ? (
                        <span className="badge bg-success">
                            Listed
                        </span>
                    ) : (
                        <span className="badge bg-danger">
                            Sold
                        </span>
                    )}
                </div>
            </Card.Body>
        </Card>
    );
}

export default NFTTile;