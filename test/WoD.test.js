const { expect } = require('chai');
const { constants } = require('@openzeppelin/test-helpers');
const { ZERO_ADDRESS } = constants;
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe('WoD', function () {
  beforeEach(async function () {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    var whitelistAddresses = [
      owner.address.toString(),
      addr1.address.toString(),
      addr2.address.toString(),
      addr3.address.toString(),
    ];

    this.leafNodes = whitelistAddresses.map((addr) => keccak256(addr));
    this.merkleTree = new MerkleTree(this.leafNodes, keccak256, { sortPairs: true });
    this.rootHash = this.merkleTree.getHexRoot();

    this.WOD = await ethers.getContractFactory('WoD');
    this.wod = await this.WOD.deploy(this.rootHash, 'TOKEN URI');
    await this.wod.deployed();
  });

  context('World of Doomens test cases', async function () {
    beforeEach(async function () {
      const [owner, addr1, addr2, addr3] = await ethers.getSigners();
      this.owner = owner;
      this.addr1 = addr1;
      this.addr2 = addr2;
      this.addr3 = addr3;

      const leaf = Buffer.from(keccak256(owner.address.toString()));
      const index = this.merkleTree.getLeafIndex(leaf);
      this.ownerProof = this.merkleTree.getHexProof(this.leafNodes[index]);

      const leaf1 = Buffer.from(keccak256(addr1.address.toString()));
      const index1 = this.merkleTree.getLeafIndex(leaf1);
      this.addr1Proof = this.merkleTree.getHexProof(this.leafNodes[index1]);

      const leaf2 = Buffer.from(keccak256(addr2.address.toString()));
      const index2 = this.merkleTree.getLeafIndex(leaf2);
      this.addr2Proof = this.merkleTree.getHexProof(this.leafNodes[index2]);

      const leaf3 = Buffer.from(keccak256(addr3.address.toString()));
      const index3 = this.merkleTree.getLeafIndex(leaf3);
      this.addr3Proof = this.merkleTree.getHexProof(this.leafNodes[index3]);
    });

    describe('Mint function with proof', async function () {
      it('Can not mint token if proof is invalid', async function () {
        await expect(
          this.wod.connect(this.addr1).mint(this.ownerProof, 1, { value: ethers.utils.parseEther('0.05') })
        ).to.be.revertedWith('Invalid merkle proof! You might not in the whitelisted');
      });

      it('Can mint a token if proof is valid', async function () {
        expect(await this.wod.mint(this.ownerProof, 1, { value: ethers.utils.parseEther('0.05') }));
      });

      it('Can mint multiple tokens if proof is valid', async function () {
        expect(await this.wod.mint(this.ownerProof, 5, { value: ethers.utils.parseEther('0.25') }));
      });

      it('Can not mint token more than limit', async function () {
        await expect(this.wod.mint(this.ownerProof, 6, { value: ethers.utils.parseEther('0.3') })).to.be.revertedWith(
          'Can not mint token more than limit'
        );
      });

      it('Can not mint token if ether is not enough', async function () {
        await expect(this.wod.mint(this.ownerProof, 1, { value: ethers.utils.parseEther('0.01') })).to.be.revertedWith(
          'Invalid amount of ether to buy token!'
        );
      });

      it('Requires mint amount to be greater than 0', async function () {
        await expect(this.wod.mint(this.ownerProof, 0, { value: ethers.utils.parseEther('0.05') })).to.be.revertedWith(
          'Can not mint zero token!'
        );
      });
    });

    describe('Check whitelist address', async function () {
      it('Should return true if proof is valid', async function () {
        expect(await this.wod.isWhitelisted(this.ownerProof)).to.be.true;
      });

      it('Should return false if proof is invalid', async function () {
        expect(await this.wod.connect(this.addr1).isWhitelisted(this.ownerProof)).to.be.false;
      });
    });

    describe('Mint function without proof', async function () {
      it('Can mint token without proof if merkle-tree is disabled', async function () {
        await this.wod.disableMerkleProof();
        expect(await this.wod.mint([], 1, { value: ethers.utils.parseEther('0.05') }));
      });
    });

    describe('Check token exists', async function () {
      beforeEach(async function () {
        const [owner, addr1, addr2, addr3] = await ethers.getSigners();
        this.owner = owner;
        this.addr1 = addr1;
        this.addr2 = addr2;
        this.addr3 = addr3;
        await this.wod.connect(this.addr1).mint(this.addr1Proof, 1, { value: ethers.utils.parseEther('0.05') });
        await this.wod.connect(this.addr2).mint(this.addr2Proof, 2, { value: ethers.utils.parseEther('0.1') });
        await this.wod.connect(this.addr3).mint(this.addr3Proof, 3, { value: ethers.utils.parseEther('0.15') });
      });

      it('verifies valid tokens', async function () {
        for (let tokenId = 0; tokenId < 6; tokenId++) {
          const exists = await this.wod.exists(tokenId);
          expect(exists).to.be.true;
        }
      });

      it('verifies invalid tokens', async function () {
        const exists = await this.wod.exists(6);
        expect(exists).to.be.false;
      });

      it('returns the amount for a given address', async function () {
        expect(await this.wod.balanceOf(this.owner.address)).to.equal('0');
        expect(await this.wod.balanceOf(this.addr1.address)).to.equal('1');
        expect(await this.wod.balanceOf(this.addr2.address)).to.equal('2');
        expect(await this.wod.balanceOf(this.addr3.address)).to.equal('3');
      });

      it('throws an exception for the 0 address', async function () {
        await expect(this.wod.balanceOf(ZERO_ADDRESS)).to.be.revertedWith('BalanceQueryForZeroAddress');
      });

      it('returns the amount for a given address', async function () {
        expect(await this.wod.numberMinted(this.owner.address)).to.equal('0');
        expect(await this.wod.numberMinted(this.addr1.address)).to.equal('1');
        expect(await this.wod.numberMinted(this.addr2.address)).to.equal('2');
        expect(await this.wod.numberMinted(this.addr3.address)).to.equal('3');
      });
    });
  });
});
