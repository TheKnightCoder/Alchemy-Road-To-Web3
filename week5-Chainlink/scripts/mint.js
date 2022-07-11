const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const BullBear = await hre.ethers.getContractFactory("BullBear");
  const contract = await BullBear.attach(process.env.CONTRACT_ADDRESS);
  await contract.safeMint(process.env.ETH_ACC_ADDRESS);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
