const hre = require("hardhat");
const abi = require("../artifacts/contracts/BuyMeACoffee.sol/BuyMeACoffee.json");

const getBalance = async (provider, address) => {
  const balanceBigInt = await provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = abi.abi;

  const provider = new hre.ethers.providers.AlchemyProvider("goerli", process.env.GOERLI_API_KEY);
  const signer = new hre.ethers.Wallet(process.env.PRIVATE_KEY, provider);

  const buyMeACoffee = new hre.ethers.Contract(contractAddress, contractABI, signer);

  console.log("current balance of owner: ", await getBalance(provider, signer.address), "ETH");
  const contractBalance = await getBalance(provider, buyMeACoffee.address);
  console.log("current balance of contract: ", contractBalance, "ETH");

  if (contractBalance !== "0.0") {
    console.log("withdrawing funds...");
    const withdrawTxn = await buyMeACoffee.withdrawTips();
    await withdrawTxn.wait();
  } else {
    console.log("no funds to withdraw");
  }

  console.log("current balance of owner: ", await getBalance(provider, signer.address), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
