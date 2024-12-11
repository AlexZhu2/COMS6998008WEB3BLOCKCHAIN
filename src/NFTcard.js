import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import build from './build.json';
import './NFTcard.css';
import { FaFileAlt, FaFilePdf, FaFileCode, FaBook } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';

function NFTTile({ data }) {
    const navigate = useNavigate();
    const [metadata, setMetadata] = useState(null);
    const [isListed, setIsListed] = useState(false);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const contract = new ethers.Contract(build.address, build.abi, provider);
                const tokenURI = await contract.tokenURI(data.tokenId);
                const response = await fetch(tokenURI.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'));
                const metadata = await response.json();
                console.log('Fetched metadata:', metadata); // Debug log
                setMetadata(metadata);

                // Check if the NFT is listed
                const listedToken = await contract.getListedTokenForId(data.tokenId);
                setIsListed(!listedToken.sold); // Assuming currentlyListed means it's sold
            } catch (error) {
                console.error('Error fetching metadata:', error);
            }
        };

        fetchMetadata();
    }, [data.tokenId]);

    const getTextPreview = () => {
        if (!metadata?.properties?.contentPreview) return null;
        
        const content = metadata.properties.contentPreview;
        const lines = content.split('\n').slice(0, 5); // Get first 5 lines
        return lines.join('\n');
    };

    const getFilePreview = () => {
        if (!metadata) return null;

        const fileType = metadata.fileType?.toLowerCase() || '';
        const iconSize = "2em";

        // Preview container styles for text-based files
        const textContainerStyle = {
            padding: '1rem',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            minHeight: '200px'
        };

        // Text preview styles
        const textPreviewStyle = {
            marginTop: '1rem',
            fontSize: '0.85rem',
            color: '#212529',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            textAlign: 'left',
            width: '100%',
            padding: '0.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
        };

        // File type specific preview components
        const previewComponents = {
            'text/plain': (
                <div style={textContainerStyle} className="text-preview-container">
                    <div className="file-icon">
                        <FaFileAlt size={iconSize} color="#495057" />
                    </div>
                    <div style={textPreviewStyle}>
                        {getTextPreview() || 'No preview available'}
                    </div>
                    <div className="file-info">
                        <small>
                            {metadata.properties?.wordCount || 0} words | 
                            {metadata.properties?.lineCount || 0} lines
                        </small>
                    </div>
                </div>
            ),
            'text/markdown': (
                <div style={textContainerStyle} className="markdown-preview-container">
                    <div className="file-icon">
                        <FaFileCode size={iconSize} color="#495057" />
                    </div>
                    <div style={textPreviewStyle}>
                        <ReactMarkdown>
                            {getTextPreview() || 'No preview available'}
                        </ReactMarkdown>
                    </div>
                    <div className="file-info">
                        <small>
                            {metadata.properties?.wordCount || 0} words | 
                            {metadata.properties?.lineCount || 0} lines
                        </small>
                    </div>
                </div>
            ),
            'application/pdf': (
                <div style={textContainerStyle} className="pdf-preview-container">
                    <FaFilePdf size={iconSize} color="#dc3545" />
                    <div className="file-name mt-2">
                        {metadata.name || 'PDF Document'}
                    </div>
                </div>
            ),
            'default': (
                <div className="image-preview-container">
                    <img 
                        src={metadata.image}
                        alt={metadata.name || 'NFT'}
                        className="nft-image"
                        crossOrigin="anonymous"
                    />
                </div>
            )
        };

        return previewComponents[fileType] || previewComponents.default;
    };

    const handleClick = () => {
        navigate(`/nftPage/${data.tokenId}`);
    };

    return (
        <Card 
            className="nft-card h-100" 
            onClick={handleClick}
        >
            <div className="nft-card-image-wrapper">
                {getFilePreview()}
            </div>
            <Card.Body className="nft-card-body">
                <Card.Title className="nft-card-title">
                    {metadata?.name || data.name || 'Unnamed NFT'}
                </Card.Title>
                <div className="d-flex justify-content-between align-items-center">
                    <span className="nft-card-price">
                        {data.price} ETH
                    </span>
                    <span className={`listing-badge ${isListed ? 'listed' : 'not-listed'}`}>
                        {isListed ? 'Listed' : 'Not Listed'}
                    </span>
                </div>
            </Card.Body>
        </Card>
    );
}

export default NFTTile;