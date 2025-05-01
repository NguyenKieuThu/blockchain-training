// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.27;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MarketPlace  {
    struct Listing {
        address nftAddress;
        uint256 tokenId;
        address seller;
        uint256 price;
        bool isActive;
    }

    event NewListing(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 price);
    event ListingCancelled(address indexed nftAddress, uint256 indexed tokenId, address indexed seller);
    event BuyListing(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 price);

    mapping(address => mapping(uint256 => uint256)) private _listMaps;
    Listing[] public listings;
    uint256[] private activeListingIndexes;
    mapping(uint256 => uint256) private _activeIndexPositions;
    bool private locked;

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    function list(address nftAddress, uint256 tokenId, uint256 price) public {
        require(IERC721(nftAddress).ownerOf(tokenId) == msg.sender, "You are not the owner of the token");
        require(IERC721(nftAddress).isApprovedForAll(msg.sender, address(this)) || IERC721(nftAddress).getApproved(tokenId) == address(this), "You must approve the marketplace to transfer the token");

        IERC721(nftAddress).transferFrom(msg.sender, address(this), tokenId);
        Listing memory listing = Listing({nftAddress: nftAddress, tokenId: tokenId, seller: msg.sender, price: price, isActive: true});
        listings.push(listing);

        _listMaps[nftAddress][tokenId] = listings.length - 1;
        activeListingIndexes.push(listings.length - 1);
        _activeIndexPositions[listings.length - 1] = activeListingIndexes.length - 1;
        emit NewListing(nftAddress, tokenId, msg.sender, price);
    }

    function cancelListing(address nftAddress, uint256 tokenId) public {
        uint256 index = _listMaps[nftAddress][tokenId];
        Listing storage listing = listings[index];
        require(listing.seller == msg.sender, "You are not the owner of the token");
        require(listing.isActive, "Listing is not active");
        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);

        listing.isActive = false;
        _removeActiveIndex(index);
        emit ListingCancelled(nftAddress, tokenId, msg.sender);
    }

    function getListingByPage(uint256 offset, uint256 limit) public view returns (Listing[] memory) {
        uint256 totalListings = activeListingIndexes.length;
        require(offset < totalListings, "Offset out of bounds");
        
        uint256 endIndex = offset + limit;
        if (endIndex > totalListings) {
            endIndex = totalListings;
        }
        
        uint256 resultSize = endIndex - offset;
        Listing[] memory results = new Listing[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            results[i] = listings[activeListingIndexes[offset + i]];
        }
        
        return results;
    }

    function buyListing(address nftAddress, uint256 tokenId) public payable nonReentrant {
        uint256 index = _listMaps[nftAddress][tokenId];
        Listing storage listing = listings[index];
        require(listing.isActive, "This listing is not active");
        require(msg.value >= listing.price, "Insufficient funds sent");
        require(IERC721(nftAddress).ownerOf(tokenId) != msg.sender, "You cannot buy your own NFT");

        listing.isActive = false;
        _removeActiveIndex(index);

        // Transfer the NFT to the buyer
        IERC721(nftAddress).transferFrom(address(this), msg.sender, tokenId);

        // Transfer the funds to the seller
        (bool success, ) = listing.seller.call{value: msg.value}("");
        require(success, "Transfer to seller failed");
        
        emit BuyListing(nftAddress, tokenId, msg.sender, 0);
    }

    function _removeActiveIndex(uint256 index) private {
        uint256 removeIndex = _activeIndexPositions[index];
        uint256 lastIndex = activeListingIndexes.length - 1;

        if (removeIndex != lastIndex) {
            uint256 lastListingIndex = activeListingIndexes[lastIndex];
            activeListingIndexes[removeIndex] = lastListingIndex;
            _activeIndexPositions[lastListingIndex] = removeIndex;
        }

        activeListingIndexes.pop();
        delete _activeIndexPositions[index];
    }

}
