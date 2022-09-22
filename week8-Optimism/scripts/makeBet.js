const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("Casino");
  const contract = await factory.attach(process.env.CONTRACT_ADDRESS);

  const valA = ethers.utils.keccak256(0xBAD060A7)
  const hashA = ethers.utils.keccak256(valA)
  const valBwin = ethers.utils.keccak256(0x600D60A7)
  const hashBwin = ethers.utils.keccak256(valBwin)

  const valBlose = ethers.utils.keccak256(0xBAD060A7)
  const hashBlose = ethers.utils.keccak256(valBlose)

  const tx1 = await contract.proposeBet(hashA, {
    value: 1e9
  });
  await tx1.wait();

  const tx2 = await contract.acceptBet(hashA, hashBwin, {
    value: 1e9
  });
  await tx2.wait();

  const tx3 = await contract.revealA(valA);
  await tx3.wait();

  const tx4 = await contract.revealB(hashA, valBwin);
  await tx4.wait();


  const tx5 = await contract.claim(hashA);
  await tx5.wait();

  // console.log('s_randomWords: ', await contract.s_randomWords(1));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
