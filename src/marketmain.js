import React from 'react';
import axios from 'axios';
import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import build from './build.json';
import { GetIpfsUrlFromPinata } from './pinata';
import NFTTile from './NFTcard';

function MarketMain() {
    const [transaction, setTransaction] = useState([]);
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);

    useEffect(() => {
        if (!dataFetched) {
            getAllTokens();
        }
    }, [dataFetched]); // Only run when dataFetched changes

    async function getAllTokens() {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(build.address, build.abi, signer);
            let transaction = await contract.getAllTokens();
            setTransaction(transaction);
            
            const items = await Promise.all(transaction.map(async i => {
                try {
                    var tokenURI = await contract.tokenURI(i.tokenId);
                    console.log("before pinata", tokenURI);
                    
                    if (!tokenURI.includes('gateway.pinata.cloud')) {
                        tokenURI = GetIpfsUrlFromPinata(tokenURI);
                    }
                    console.log("after pinata", tokenURI);
                    
                    let meta = await axios.get(tokenURI);
                    
                    let price = ethers.formatEther(i.price);
                    return {
                        price,
                        tokenId: Number(i.tokenId),
                        seller: i.seller,
                        owner: i.owner,
                        image: meta.data.image,
                        name: meta.data.name,
                        description: meta.data.description,
                    };
                } catch (error) {
                    console.error(`Error fetching metadata for token ${i.tokenId}:`, error);
                    return {
                        price: ethers.formatEther(i.price),
                        tokenId: Number(i.tokenId),
                        seller: i.seller,
                        owner: i.owner,
                        image: 'default-image-url.jpg',
                        name: 'Metadata Unavailable',
                        description: 'Could not load NFT metadata',
                    };
                }
            }));

            updateFetched(true);
            updateData(items.filter(item => item !== null));
        } catch (error) {
            console.error("Error fetching tokens:", error);
        }
    }

    return (
        <div className="flex flex-col items-center py-8">
            <h1 className="text-3xl font-bold text-white mb-8">
                Top NFTs
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
                {data.map((value, index) => {
                    return (
                        <div className="flex justify-center" key={index}>
                            <NFTTile data={value}></NFTTile>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default MarketMain;