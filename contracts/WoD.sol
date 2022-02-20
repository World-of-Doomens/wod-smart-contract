// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.11;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "erc721a/contracts/ERC721A.sol";

contract WoD is ERC721A, Ownable {
    using MerkleProof for bytes32[];

    bytes32 public merkleRoot;
    bool public merkleEnabled = true;
    string private baseURI;
    uint256 public constant MAX_SUPPLY = 8888;
    uint256 public constant PRICE = 0.05 * 1e18;

    constructor(bytes32 _merkleRoot, string memory _baseUri) ERC721A("World of Doomens", "WODS") {
        merkleRoot = _merkleRoot;
        baseURI = _baseUri;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _baseUri) public onlyOwner {
        baseURI = _baseUri;
    }

    function mint(bytes32[] memory proof, uint256 amount) external payable {
        if (merkleEnabled) {
            bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
            require(proof.verify(merkleRoot, leaf), "Invalid merkle proof! You might not in the whitelisted");
        }

        require(amount > 0, "Can not mint zero token!");
        require(msg.value == PRICE * amount, "Invalid amount of ether to buy token!");

        _safeMint(msg.sender, amount);
    }

    function withdraw() external payable onlyOwner {
        uint balance = address(this).balance;
        require(balance > 0, "No ether left to withdraw");

        (bool success, ) = (msg.sender).call{value: balance}("");
        require(success, "Withdraw failed.");
    }

    function getEtherBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
    }

    function enableMerkleProof() external onlyOwner {
        merkleEnabled = true;
    }

    function disableMerkleProof() external onlyOwner {
        merkleEnabled = false;
    }
}
