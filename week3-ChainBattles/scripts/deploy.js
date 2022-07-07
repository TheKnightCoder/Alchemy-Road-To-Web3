const main = async () => {
  const nftContractFactory = await ethers.getContractFactory("ChainBattles");
  const nftContract = await nftContractFactory.deploy();

  await nftContract.deployed();

  console.log('Contract deployed to:', nftContract.address);
}

main();