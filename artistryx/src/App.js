import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const contractAddress = 'YOUR_CONTRACT_ADDRESS';
const contractABI = [ /* Replace with your contract ABI */ ];

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    if (window.ethereum) {
      setupProvider();
    } else {
      alert("Please install MetaMask to interact with this DApp.");
    }
  }, []);

  const setupProvider = async () => {
    const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(web3Provider);
    const web3Signer = web3Provider.getSigner();
    setSigner(web3Signer);
    setContract(new ethers.Contract(contractAddress, contractABI, web3Signer));
  };

  const connectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await provider.listAccounts();
      setWalletAddress(accounts[0]);
      getBalance(accounts[0]);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const getBalance = async (address) => {
    try {
      const balance = await provider.getBalance(address);
      setBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const interactWithContract = async () => {
    if (!contract) return;
    try {
      // Example: Call a read-only function
      const result = await contract.someReadFunction();
      console.log("Contract Result:", result);

      // Example: Call a function that changes state
      const tx = await contract.someWriteFunction();
      await tx.wait();
      console.log("Transaction confirmed:", tx.hash);
    } catch (error) {
      console.error("Error interacting with contract:", error);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>React Web3 App</h1>
      <button onClick={connectWallet}>
        {walletAddress ? `Connected: ${walletAddress}` : "Connect Wallet"}
      </button>

      {walletAddress && (
        <div>
          <p>Wallet Balance: {balance} ETH</p>
          <button onClick={interactWithContract}>Interact with Contract</button>
        </div>
      )}
    </div>
  );
}

export default App;
