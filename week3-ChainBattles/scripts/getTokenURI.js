const main = async () => {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const nftContractFactory = await ethers.getContractFactory("ChainBattles");
  const nftContract = await nftContractFactory.attach(contractAddress);

  const res = await nftContract.tokenURI(1);

  console.log(res);
}

main();