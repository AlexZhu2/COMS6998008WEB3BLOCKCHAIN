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
    event ContentPurchased(uint contentId, address indexed buyer);

    // 注册发布内容
    function publishContent(string memory _title, string memory _contentHash, uint _price) public {
        contentCounter++;
        contents[contentCounter] = Content(contentCounter, payable(msg.sender), _title, _contentHash, _price, true);
        
        emit ContentPublished(contentCounter, msg.sender, _price);
    }

    // 购买内容
    function purchaseContent(uint _contentId) public payable {
        Content storage content = contents[_contentId];
        require(content.forSale, "Content not for sale");
        require(msg.value >= content.price, "Insufficient funds sent");

        // 更新余额
        balances[content.creator] += msg.value;

        // 停止售卖
        content.forSale = false;

        emit ContentPurchased(_contentId, msg.sender);
    }

    // 提取余额
    function withdrawBalance() public {
        uint balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        balances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);
    }
}
