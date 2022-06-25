// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");


const getBalance = async (address) => {
  const balanceBigInt = await hre.waffle.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

const printBalances = async (addresses) => {
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${idx} balance: `, await getBalance(address));
    idx++;
  }
}

const printMemos = async (memos) => {
  for (const {
    timestamp,
    name: tipper,
    from: tipperAddress,
    message
  } of memos) {
    console.log(`At ${timestamp}, ${tipper} ${tipperAddress} said: ${message}`);
  }
}


async function main() {
  // get example accounts
  const [owner, tipper, tipper2, tipper3] = await hre.ethers.getSigners();

  // deploy contract
  const buyMeACoffeeFactory = await hre.ethers.getContractFactory("BuyMeACoffee");
  const buyMeACoffee = await buyMeACoffeeFactory.deploy();
  await buyMeACoffee.deployed();
  console.log("BuyMeACoffee deployed to :", buyMeACoffee.address);

  // check balances before coffee purchase
  const addresses = [owner.address, tipper.address, buyMeACoffee.address];
  console.log("==start==");
  await printBalances(addresses);

  // buy owner coffees
  const tip = { value: hre.ethers.utils.parseEther("1") };
  await buyMeACoffee.connect(tipper).buyCoffee("Russ", "This is so cool", tip);
  await buyMeACoffee.connect(tipper).buyCoffee("Bob", "Hi I'm bob", tip);
  await buyMeACoffee.connect(tipper).buyCoffee("Bill", "Billy buy coffee", tip);

  // check balances after coffee purchase
  console.log("==bought coffee==");
  await printBalances(addresses);

  // withdraw funds
  await buyMeACoffee.connect(owner).withdrawTips();

  // check balances after widraw
  console.log("==after withdraw==");
  await printBalances(addresses);

  // read all memos
  console.log("==memos==");
  const memos = await buyMeACoffee.getMemos();
  printMemos(memos);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
