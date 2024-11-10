// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ContentPlatform {

    struct Content {
        uint id;
        address payable creator;
        string title;
        string contentHash;
        uint price;
        bool forSale;
    }

    mapping(uint => Content) public contents;
    mapping(address => uint) public balances;
    uint public contentCounter;

    event ContentPublished(uint contentId, address indexed creator, uint price);
    event ContentPurchased(uint contentId, address indexed buyer, uint price);

    // Function to publish content
    function publishContent(string memory _title, string memory _contentHash, uint _price) public {
        require(bytes(_title).length > 0, "Title is required");
        require(bytes(_contentHash).length > 0, "Content hash is required");
        require(_price > 0, "Price must be greater than zero");

        contentCounter++;
        contents[contentCounter] = Content({
            id: contentCounter,
            creator: payable(msg.sender),
            title: _title,
            contentHash: _contentHash,
            price: _price,
            forSale: true
        });

        emit ContentPublished(contentCounter, msg.sender, _price);
    }

    // Function to purchase content
    function purchaseContent(uint _contentId) public payable {
        Content storage content = contents[_contentId];
        require(content.forSale, "Content not for sale");
        require(msg.value >= content.price, "Insufficient funds sent");

        // Transfer funds to creator's balance
        balances[content.creator] += msg.value;

        // Mark content as sold
        content.forSale = false;

        emit ContentPurchased(_contentId, msg.sender, content.price);
    }

    // Function for creator to withdraw their balance
    function withdrawBalance() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }
}
