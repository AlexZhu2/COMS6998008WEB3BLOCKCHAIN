import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import build from './build.json';
import './NFTcard.css';

function NFTTile({ data }) {
    const navigate = useNavigate();
    const [isListed, setIsListed] = useState(null);

    useEffect(() => {
        const fetchTokenInfo = async () => {
            const listedToken = await getTokenInfo();
            if (listedToken) {
                setIsListed(listedToken.sold === false);
            }
        };
        fetchTokenInfo();
    }, [data.tokenId]);

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

    return (
        <Card 
          className="nft-card h-100" 
          onClick={handleClick}
        >
          {data.image && (
            <div className="nft-card-image-wrapper">
              <Card.Img 
                src={data.image}
                alt={data.name || 'NFT'}
                className="nft-card-image"
                crossOrigin="anonymous"
              />
              <div className="nft-card-image-overlay"></div>
            </div>
          )}
          <Card.Body className="nft-card-body">
            <Card.Title className="nft-card-title">
              {data.name || 'Unnamed NFT'}
            </Card.Title>
            <div className="d-flex justify-content-between align-items-center">
              <span className="nft-card-price">
                {data.price} ETH
              </span>
              {isListed ? (
                <span className="badge nft-badge bg-success">Listed</span>
              ) : (
                <span className="badge nft-badge bg-danger">Not Listed</span>
              )}
            </div>
          </Card.Body>
        </Card>
      );
      
}

export default NFTTile;