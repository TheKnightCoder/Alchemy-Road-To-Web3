const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const BullBear = await hre.ethers.getContractFactory("BullBear");
  const contract = await BullBear.attach(process.env.CONTRACT_ADDRESS);
  await contract.requestRandomWords();
  console.log('s_randomWords: ', await contract.s_randomWords(1));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
