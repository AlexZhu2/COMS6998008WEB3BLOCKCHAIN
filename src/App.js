import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ethers } from 'ethers';
import axios from 'axios';
import build from './build.json';
import MarketMain from './marketmain';
import NFTDetail from './NFTdetail';
import { GetIpfsUrlFromPinata } from './pinata';
import Navbar from './navbar';

function App() {
    const [nfts, setNfts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllNFTs();
    }, []);

    const fetchAllNFTs = async () => {
        try {
            setLoading(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(build.address, build.abi, signer);

            let transaction = await contract.getAllTokens();

            const items = await Promise.all(transaction.map(async i => {
                const tokenURI = await contract.tokenURI(i.tokenId);
                const IPFSUrl = GetIpfsUrlFromPinata(tokenURI);
                let meta = await axios.get(IPFSUrl);
                meta = meta.data;

                let price = ethers.formatEther(i.price);
                let item = {
                    price,
                    tokenId: Number(i.tokenId),
                    seller: i.seller,
                    owner: i.owner,
                    image: GetIpfsUrlFromPinata(meta.image),
                    name: meta.name,
                    description: meta.details,
                }
                return item;
            }));

            setNfts(items);
        } catch (error) {
            console.error("Error fetching all NFTs:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Router>
            <div className="App">
                <Navbar />
                {loading ? (
                    <div className="text-center text-white py-5">Loading...</div>
                ) : (
                    <Routes>
                        <Route path="/" element={<MarketMain nfts={nfts} />} />
                        <Route 
                            path="/nftPage/:tokenId" 
                            element={<NFTDetail nfts={nfts} />} 
                        />
                    </Routes>
                )}
            </div>
        </Router>
    );
}

export default App;
