const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [wallet] = await ethers.getSigners();
  const MockPriceFeed = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockContract = await MockPriceFeed.deploy(8, 3034715771688);

  await mockContract.deployed();

  console.log('mock contract: ', mockContract.address);

  const BullBear = await hre.ethers.getContractFactory("BullBear");
  const contract = await BullBear.deploy(10, mockContract.address, 8224); // updateInterval(secs), priceFeed, vrf subscriptionId
  await contract.deployed();

  console.log('contract: ', contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Mock
// mock contract:  0x1A68E706b6F6655B0673B152BC6B8cC9F497cac4
// contract:  0xFd288D8754bC7F10921B5363D83e2D515ec6AC95

// Read BTC/USD price feed
// contract: 0x0dC32F0F6Fd80B572804a341c1E996b93199b358