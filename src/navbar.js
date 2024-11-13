import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHome, FaUpload, FaUserAlt, FaWallet, FaEthereum } from 'react-icons/fa'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import './navbar.css';

function MyNavbar() {
  const [buttonText, setButtonText] = React.useState('Connect Wallet');
  const [userAddress, setUserAddress] = React.useState('');
  const [isConnected, setIsConnected] = React.useState(false);

  function updateButtonText(text) {
    setButtonText(text);
  }

  async function getAddress() {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    const account = accounts[0];
    setUserAddress(account);
    setIsConnected(true);
    // Optional: Shorten the address for display
    const shortAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;
    updateButtonText(shortAddress);
  }

  function handleDisconnect() {
    setUserAddress('');
    setIsConnected(false);
    updateButtonText('Connect Wallet');
  }

  async function handleWalletClick() {
    if (isConnected) {
      handleDisconnect();
    } else {
      await handleConnectWallet();
    }
  }

  async function handleConnectWallet() {
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        }).catch(async (switchError) => {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Testnet',
                nativeCurrency: {
                  name: 'SepoliaETH',
                  symbol: 'SepoliaETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io']
              }]
            });
          }
        });
      }
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await getAddress();
    } catch (error) {
      console.log(error);
    }
  }

  React.useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        if (accounts.length > 0) {
          getAddress();
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          handleDisconnect();
        } else {
          getAddress();
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleDisconnect);
      }
    };
  }, []);

  const renderWalletButton = () => {
    if (isConnected) {
      return (
        <Nav className="d-flex align-items-center wallet-connected">
          <Nav.Link
            className="text-success me-0 pe-0 wallet-button"
            style={{ cursor: 'default' }}
          >
            <FaWallet style={{ marginRight: '8px' }} />
            {buttonText}
          </Nav.Link>
          <NavDropdown
            title={<FaEthereum className="text-secondary" />}
            id="wallet-dropdown"
            align="end"
            className="wallet-dropdown"
          >
            <NavDropdown.Item onClick={handleDisconnect}>
              <FaWallet style={{ marginRight: '8px' }} />
              Disconnect Wallet
            </NavDropdown.Item>
            <NavDropdown.Item
              href={`https://sepolia.etherscan.io/address/${userAddress}`}
              target="_blank"
            >
              <FaEthereum style={{ marginRight: '8px' }} />
              View on Etherscan
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      );
    }
  
    return (
      <Nav.Link
        onClick={handleConnectWallet}
        className="text-danger wallet-connect"
      >
        <FaWallet style={{ marginRight: '8px' }} />
        Connect Wallet
      </Nav.Link>
    );
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="shadow">
      <Container>
        {/* <Navbar.Brand as={Link} to="/">ArtistryX</Navbar.Brand> */}
        <Navbar.Brand as={Link} to="/" className="brand-logo">
          ArtistryX
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">
              <FaHome style={{ marginRight: '8px' }} /> Home
            </Nav.Link>
            <Nav.Link as={Link} to="/upload">
              <FaUpload style={{ marginRight: '8px' }} /> Upload Product
            </Nav.Link>
            <Nav.Link as={Link} to="/personal">
              <FaUserAlt style={{ marginRight: '8px' }} /> My Products
            </Nav.Link>
          </Nav>
          <Nav>
            {renderWalletButton()}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default MyNavbar;
