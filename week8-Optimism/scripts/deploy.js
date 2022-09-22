const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const [wallet] = await ethers.getSigners();

  const factory = await hre.ethers.getContractFactory("Casino");
  const contract = await factory.deploy();
  await contract.deployed();

  console.log('contract: ', contract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});