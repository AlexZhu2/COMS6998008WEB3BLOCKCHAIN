import React from 'react';
import { Navbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

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
        <Nav className="d-flex align-items-center">
          <Nav.Link 
            className="text-success me-0 pe-0"
            style={{ cursor: 'default' }}
          >
            {buttonText}
          </Nav.Link>
          <NavDropdown 
            title="" 
            id="wallet-dropdown"
            align="end"
          >
            <NavDropdown.Item onClick={handleDisconnect}>
              Disconnect Wallet
            </NavDropdown.Item>
            <NavDropdown.Item 
              href={`https://sepolia.etherscan.io/address/${userAddress}`}
              target="_blank"
            >
              View on Etherscan
            </NavDropdown.Item>
          </NavDropdown>
        </Nav>
      );
    }
    
    return (
      <Nav.Link 
        onClick={handleConnectWallet}
        className="text-danger"
        style={{ cursor: 'pointer' }}
      >
        Connect Wallet
      </Nav.Link>
    );
  };

  return (
    <Navbar bg="light" expand="lg">
      <Container>
        <Navbar.Brand as={Link} to="/">ArtistryX</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/upload">Upload Product</Nav.Link>
            <Nav.Link as={Link} to="/my-products">My Products</Nav.Link>
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
