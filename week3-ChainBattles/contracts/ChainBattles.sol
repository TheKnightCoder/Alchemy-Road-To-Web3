//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract ChainBattles is ERC721URIStorage {
    using Strings for uint256;
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIds;

    struct Attributes {
        uint256 level;
        uint256 hp;
        uint256 strength;
        uint256 speed;
    }
    mapping(uint256 => Attributes) public tokenIdToAttr;

    constructor() ERC721("Chain Battles", "CBTTL") {}

    function generateCharacter(uint256 tokenId) public view returns (string memory) {
        bytes memory svg = abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
            "<style>.base { fill: white; font-family: serif; font-size: 14px; }</style>",
            '<rect width="100%" height="100%" fill="black" />',
            '<text x="50%" y="40%" class="base" dominant-baseline="middle" text-anchor="middle">',"Warrior","</text>",
            '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">',"Levels: ",getLevels(tokenId),"</text>",
            '<text x="50%" y="60%" class="base" dominant-baseline="middle" text-anchor="middle">',"HP: ",getHp(tokenId),"</text>",
            '<text x="50%" y="65%" class="base" dominant-baseline="middle" text-anchor="middle">',"Strength: ",getStrength(tokenId),"</text>",
            '<text x="50%" y="70%" class="base" dominant-baseline="middle" text-anchor="middle">',"Speed: ",getSpeed(tokenId),"</text>",
            "</svg>"
        );

        return
            string(
                abi.encodePacked(
                    "data:image/svg+xml;base64,",
                    Base64.encode(svg)
                )
            );
    }

    function getLevels(uint256 tokenId) public view returns (string memory) {
        uint256 levels = tokenIdToAttr[tokenId].level;
        return levels.toString();
    }

    function getHp(uint256 tokenId) public view returns (string memory) {
        uint256 hp = tokenIdToAttr[tokenId].hp;
        return hp.toString();
    }

    function getStrength(uint256 tokenId) public view returns (string memory) {
        uint256 strength = tokenIdToAttr[tokenId].strength;
        return strength.toString();
    }

    function getSpeed(uint256 tokenId) public view returns (string memory) {
        uint256 speed = tokenIdToAttr[tokenId].speed;
        return speed.toString();
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        bytes memory dataURI = abi.encodePacked(
            '{',
                '"name": "Chain Battles #', tokenId.toString(), '",',
                '"description": "Battles on chain",',  
                '"image": "', generateCharacter(tokenId), '"'  
            '}'
        );
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(dataURI)
            )
        );
    }

    function random(uint256 nonce) private view returns (uint) {
        return uint(keccak256(abi.encodePacked(block.difficulty, block.timestamp, msg.sender, _tokenIds.current(), nonce)));
    }

    function mint() public {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _safeMint(msg.sender, newItemId);
        tokenIdToAttr[newItemId].level = 0;
        tokenIdToAttr[newItemId].hp = random(0) % 1000;
        tokenIdToAttr[newItemId].strength = random(1) % 500;
        tokenIdToAttr[newItemId].speed = random(2) % 200;
        _setTokenURI(newItemId, tokenURI(newItemId));
    }

    function train(uint256 tokenId) public {
        require(_exists(tokenId), "Please use an existing Token");
        require(ownerOf(tokenId) == msg.sender, "You must own this token to train it");
        tokenIdToAttr[tokenId].level++;
        tokenIdToAttr[tokenId].hp += 10;
        tokenIdToAttr[tokenId].strength += 5;
        tokenIdToAttr[tokenId].speed += 2;
        _setTokenURI(tokenId, tokenURI(tokenId));
    }
}
