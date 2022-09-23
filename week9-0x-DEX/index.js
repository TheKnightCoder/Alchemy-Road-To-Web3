const { default: BigNumber } = require('bignumber.js');
const qs = require('qs');
const Web3 = require('web3');

let currentTrade = {};
let currentSelectSide;

async function init() {
  await listAvailableTokens();
}

async function listAvailableTokens() {
  console.log("initializing");
  let response = await fetch("https://tokens.coingecko.com/uniswap/all.json");
  let tokenListJSON = await response.json();
  console.log('listing available tokens: ', tokenListJSON);

  tokens = tokenListJSON.tokens;
  console.log('tokens:', tokens);
  let parent = document.getElementById("token_list");
  for (const i in tokens) {
    let div = document.createElement("div");
    div.className = "token_row";

    let html =
      `<img class="token_list_img" src=${tokens[i].logoURI}/>
    <span class="token_list_text">${tokens[i].symbol}</span>`;

    div.innerHTML = html;
    div.onclick = () => {
      selectToken(tokens[i]);
    }
    parent.appendChild(div);
  }
}

async function selectToken(token) {
  closeModal();
  currentTrade[currentSelectSide] = token;
  console.log('currentTrade: ', currentTrade);
  renderInterface();
}

function renderInterface() {
  if (currentTrade.from) {
    document.getElementById("from_token_img").src = currentTrade.from.logoURI;
    document.getElementById("from_token_text").innerHTML = currentTrade.from.symbol;
  }
  if (currentTrade.to) {
    document.getElementById("to_token_img").src = currentTrade.to.logoURI;
    document.getElementById("to_token_text").innerHTML = currentTrade.to.symbol;
  }
}

async function connect() {
  if (typeof window.ethereum !== "undefined") {
    try {
      console.log("connecting");
      await ethereum.request({ method: "eth_requestAccounts" });
    } catch (error) {
      console.log(error);
    }
    document.getElementById("login_button").innerHTML = "Connected";
    document.getElementById("swap_button").disabled = false;
  } else {
    document.getElementById("login_button").innerHTML =
      "Please install MetaMask";
  }
}

async function openModal(side) {
  currentSelectSide = side;
  document.getElementById("token_modal").style.display = "block";
}
async function closeModal() {
  document.getElementById("liq_sources").innerHTML = "";
  document.getElementById("token_modal").style.display = "none";
}

async function getPrice() {
  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;

  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount
  }

  // fetch the swap price
  const response = await fetch(`https://api.0x.org/swap/v1/price?${qs.stringify(params)}`);
  swapPriceJSON = await response.json();

  document.getElementById("liq_sources").innerHTML = getSources(swapPriceJSON.sources);

  console.log('Price', swapPriceJSON);

  document.getElementById("to_amount").value = swapPriceJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapPriceJSON.estimatedGas;
}

async function getQuote(address) {
  if (!currentTrade.from || !currentTrade.to || !document.getElementById("from_amount").value) return;

  let amount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

  const params = {
    sellToken: currentTrade.from.address,
    buyToken: currentTrade.to.address,
    sellAmount: amount,
    takerAddress: address
  }

  // fetch the swap quote
  const response = await fetch(`https://api.0x.org/swap/v1/quote?${qs.stringify(params)}`);
  swapQuoteJSON = await response.json();
  console.log('Quote', swapQuoteJSON);

  document.getElementById("to_amount").value = swapQuoteJSON.buyAmount / (10 ** currentTrade.to.decimals);
  document.getElementById("gas_estimate").innerHTML = swapQuoteJSON.estimatedGas;

  return swapQuoteJSON;
}

const getSources = (sources) => sources
  .filter((source) => source.proportion !== "0")
  .map((source) => `${source.name} ${Number(source.proportion) * 100}%`)
  .join(" -> ")

async function trySwap() {
  let accounts = await ethereum.request({ method: "eth_accounts" });
  let takerAddress = accounts[0];
  const web3 = new Web3(Web3.givenProvider);

  console.log("takerAddress: ", takerAddress);
  console.log('try');
  const swapQuoteJSON = await getQuote(takerAddress);
  console.log('swapQuoteJSON', swapQuoteJSON);

  if (swapQuoteJSON.code == 105) {
    console.log('approving');
    const swapQuoteJSON = await getQuote();
    const fromTokenAddress = currentTrade.from.address;
    const erc20abi = [{ "constant": true, "inputs": [], "name": "name", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "totalSupply", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_from", "type": "address" }, { "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": true, "inputs": [], "name": "symbol", "outputs": [{ "name": "", "type": "string" }], "payable": false, "stateMutability": "view", "type": "function" }, { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "payable": false, "stateMutability": "nonpayable", "type": "function" }, { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }, { "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "name": "", "type": "uint256" }], "payable": false, "stateMutability": "view", "type": "function" }, { "payable": true, "stateMutability": "payable", "type": "fallback" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "owner", "type": "address" }, { "indexed": true, "name": "spender", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "name": "from", "type": "address" }, { "indexed": true, "name": "to", "type": "address" }, { "indexed": false, "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" }]
    const ERC20TokenContract = new web3.eth.Contract(erc20abi, fromTokenAddress);

    const approvalAmount = Number(document.getElementById("from_amount").value * 10 ** currentTrade.from.decimals);

    ERC20TokenContract.methods.approve(
      swapQuoteJSON.allowanceTarget,
      approvalAmount,
    )
      .send({ from: takerAddress })
      .then(tx => {
        console.log("tx: ", tx);
      })

    console.log("setup ERC20TokenContract: ", ERC20TokenContract);
  } else {
    document.getElementById("liq_sources").innerHTML = getSources(swapQuoteJSON.sources);
    const receipt = await web3.eth.sendTransaction(swapQuoteJSON);
    console.log("receipt: ", receipt);
  }
}

init();
document.getElementById("login_button").onclick = connect;
document.getElementById("from_token_select").onclick = () => {
  openModal("from");
}
document.getElementById("to_token_select").onclick = () => {
  openModal("to");
}
document.getElementById("modal_close").onclick = closeModal;
document.getElementById("from_amount").onblur = getPrice;
document.getElementById("swap_button").onclick = trySwap;