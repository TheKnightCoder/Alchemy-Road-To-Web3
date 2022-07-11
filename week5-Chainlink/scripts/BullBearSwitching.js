const { ethers } = require("hardhat");
const hre = require("hardhat");

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {
  const [wallet] = await ethers.getSigners();
  const MockPriceFeed = await hre.ethers.getContractFactory("MockV3Aggregator");
  const mockContract = await MockPriceFeed.deploy(8, 3034715771688);

  await mockContract.deployed();

  const BullBear = await hre.ethers.getContractFactory("BullBear");
  const contract = await BullBear.deploy(2, mockContract.address);
  await contract.deployed();

  await contract.safeMint(wallet.address);
  console.log(await contract.currentPrice());
  console.log(await contract.tokenURI(0));

  await mockContract.updateAnswer(3024715771688);
  await timeout(2000)
  console.log(await contract.checkUpkeep([]));
  await contract.performUpkeep([]);
  console.log(await contract.currentPrice());


  console.log(await contract.tokenURI(0));


  await mockContract.updateAnswer(4024715771688);
  console.log(await contract.checkUpkeep([]));
  await contract.performUpkeep([]);

  console.log(await contract.currentPrice());

  console.log(await contract.tokenURI(0));

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
