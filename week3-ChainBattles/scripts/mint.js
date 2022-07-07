const main = async () => {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const nftContractFactory = await ethers.getContractFactory("ChainBattles");
  const nftContract = await nftContractFactory.attach(contractAddress);

  await nftContract.mint();

  console.log('minted');
}

main();