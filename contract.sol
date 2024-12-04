// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "hardhat/console.sol";

contract ArtystryXMarketplace is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    address payable owner;
    uint256 listingPrice = 0 ether;

    constructor() ERC721("ArtystryXMarketplace", "ARTX") {
        owner = payable(msg.sender);
    }

    struct ListedToken{
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    mapping(uint256 => ListedToken) private idToListedToken;

    // Update listing price, only owner can update
    function updateListingPrice(uint256 _listingPrice) public payable {
        require(owner == msg.sender, "Only owner can update listing price");
        listingPrice = _listingPrice;
    }

    // Get listing price, anyone can get
    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    // Get latest token ID
    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        return idToListedToken[_tokenIds.current()];
    }

    // Get listed token for ID
    function getListedTokenForId(uint256 _tokenId) public view returns (ListedToken memory) {
        return idToListedToken[_tokenId];
    }

    // Get current token ID
    function getCurrentTokens() public view returns (uint256) {
        return _tokenIds.current();
    }

    // Add token to marketplace
    function createToken(string memory tokenURI, uint256 price) public payable returns (uint256) {
        require(msg.value == listingPrice, "Insufficient listing price");
        require(price > 0, "Price must be greater than 0");
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        createListedToken(newTokenId, price);
        return newTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        idToListedToken[tokenId] = ListedToken(tokenId, payable(msg.sender), payable(address(this)), price, false);
        _transfer(msg.sender, address(this), tokenId);
    }

    function getAllTokens() public view returns (ListedToken[] memory) {
        uint256 tokenCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](tokenCount);
        for (uint256 i = 0; i < tokenCount; i++) {
            tokens[i] = idToListedToken[i + 1];
        }
        return tokens;
    }

    function getTokensOfOwner(address ownerAddress) public view returns (ListedToken[] memory) {
        uint256 totalItemCount = _tokenIds.current();
        uint256 itemCount = 0;
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToListedToken[i + 1].owner == ownerAddress || idToListedToken[i + 1].seller == ownerAddress) {
                itemCount += 1;
            }
        }
        ListedToken[] memory tokens = new ListedToken[](itemCount);
        for (uint256 i = 0; i < totalItemCount; i++) {
            if (idToListedToken[i + 1].owner == ownerAddress || idToListedToken[i + 1].seller == ownerAddress) {
                tokens[currentIndex] = idToListedToken[i + 1];
                currentIndex += 1;
            }
        }
        return tokens;
    }

    function executeSale(uint256 tokenId) public payable {
        uint256 price = idToListedToken[tokenId].price;
        require(msg.value == price, "Please submit the asking price in order to complete the purchase");
        address payable seller = idToListedToken[tokenId].seller;
        idToListedToken[tokenId].seller = payable(msg.sender);
        idToListedToken[tokenId].sold = true;
        _itemsSold.increment();
        _transfer(address(this), msg.sender, tokenId);
        approve(address(this), tokenId);
        payable(owner).transfer(listingPrice);
        payable(seller).transfer(msg.value);
    }

    // Function to resell a token
    function resellToken(uint256 tokenId, uint256 price) public payable {
        require(ownerOf(tokenId) == msg.sender, "You must own the token to resell it");
        require(msg.value >= listingPrice, "Insufficient listing fee");
        require(price > 0, "Price must be greater than zero");
        
        // Refund excess ETH if overpaid
        if (msg.value > listingPrice) {
            payable(msg.sender).transfer(msg.value - listingPrice);
        }
    
        // Update the listed token details
        idToListedToken[tokenId].sold = false;
        idToListedToken[tokenId].price = price;
        idToListedToken[tokenId].seller = payable(msg.sender);
        idToListedToken[tokenId].owner = payable(address(this));
    
        _itemsSold.decrement();
    
        // Transfer the token to the contract for reselling
        safeTransferFrom(msg.sender, address(this), tokenId);
    }

}

