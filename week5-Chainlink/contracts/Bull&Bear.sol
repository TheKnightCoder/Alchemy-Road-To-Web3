// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract BullBear is
    ERC721,
    ERC721Enumerable,
    ERC721URIStorage,
    Ownable,
    KeeperCompatibleInterface,
    VRFConsumerBaseV2
{
    // Network: Rinkeby
    using Counters for Counters.Counter;
    event TrendUpdated(string marketTrend);

    // VRF Randomness Variables
    VRFCoordinatorV2Interface COORDINATOR; // Interface to connect to VRF contract to call requestRandomWords
    address vrfCoordinator = 0x6168499c0cFfCaCD319c818142124B7A15E857ab; // Contract for randomness https://docs.chain.link/docs/vrf-contracts/#configurations

    uint64 s_subscriptionId; // 0xf5cfdd3f29f8cc6603edc9efbda59755ff036a05 created VRF subscription, where you fund the LINK created at https://vrf.chain.link/
    bytes32 keyHash =
        0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc; // The gas lane to use, which specifies the maximum gas price to bump to. https://docs.chain.link/docs/vrf-contracts/#configurations

    uint256 public s_requestId;

    // Keepers Variables: create at https://keepers.chain.link/rinkeby (there is a time-based keeper where you don't need the custom logic)

    uint256 public interval; // immutable interval; // usually immutable or only owner changeable (immutable var can be set in constructor)
    uint256 public lastTimeStamp;

    // Price Feed Variables

    AggregatorV3Interface public priceFeed;
    int256 public currentPrice;

    // Other Variables
    enum MarketTrend {
        BULL,
        BEAR
    } // Create Enum
    MarketTrend public currentMarketTrend = MarketTrend.BULL;
    Counters.Counter private _tokenIdCounter;

    string[] bullUrisIpfs = [
        "https://ipfs.io/ipfs/QmRXyfi3oNZCubDxiVFre3kLZ8XeGt6pQsnAQRZ7akhSNs?filename=gamer_bull.json",
        "https://ipfs.io/ipfs/QmRJVFeMrtYS2CUVUM2cHJpBV5aX2xurpnsfZxLTTQbiD3?filename=party_bull.json",
        "https://ipfs.io/ipfs/QmdcURmN1kEEtKgnbkVJJ8hrmsSWHpZvLkRgsKKoiWvW9g?filename=simple_bull.json"
    ];
    string[] bearUrisIpfs = [
        "https://ipfs.io/ipfs/Qmdx9Hx7FCDZGExyjLR6vYcnutUR8KhBZBnZfAPHiUommN?filename=beanie_bear.json",
        "https://ipfs.io/ipfs/QmTVLyTSuiKGUEmb88BgXG3qNC8YgpHZiFbjHrXKH3QHEu?filename=coolio_bear.json",
        "https://ipfs.io/ipfs/QmbKhBXVWmwrYsTPFYfroR2N7NAekAMxHUVg2CWks7i9qj?filename=simple_bear.json"
    ];

    constructor(
        uint256 updateInterval, // interval to trigger the keeper in seconds
        address _priceFeed, // 	0xECe365B379E1dD183B20fc5f022230C044d51404 BTC/USD Rinkeby https://docs.chain.link/docs/ethereum-addresses/
        uint64 subscriptionId // VRF Randomness subscription ID, found from creating subscription https://vrf.chain.link/
    ) ERC721("Bull&Bear", "BBTK") VRFConsumerBaseV2(vrfCoordinator) {
        interval = updateInterval;
        lastTimeStamp = block.timestamp;
        priceFeed = AggregatorV3Interface(_priceFeed);
        currentPrice = getLatestPrice();
        COORDINATOR = VRFCoordinatorV2Interface(vrfCoordinator);
        s_subscriptionId = subscriptionId;
    }

    // update vars functions
    function setInterval(uint256 newInterval) public onlyOwner {
        interval = newInterval;
    }

    function setPriceFeed(address newFeed) public onlyOwner {
        priceFeed = AggregatorV3Interface(newFeed);
    }

    // minting function
    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);

        // Defaults to gamer bull NFT image.
        string memory defaultUri = bullUrisIpfs[0];
        _setTokenURI(tokenId, defaultUri);
    }

    // ==== upkeep functions ====
    // called by upkeep to trigger performUpkeep function
    function checkUpkeep(
        bytes calldata /*checkData*/
    )
        external
        view
        override
        returns (
            bool upkeepNeeded,
            bytes memory /* performData */
        )
    {
        upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
    }

    // triggerd by keeper when checkUpkeep is true
    function performUpkeep(
        bytes calldata /* performData */
    ) external override {
        if ((block.timestamp - lastTimeStamp) > interval) {
            lastTimeStamp = block.timestamp;
            int256 latestPrice = getLatestPrice();

            if (latestPrice == currentPrice) {
                return;
            }
            if (latestPrice < currentPrice) {
                // bear
                currentMarketTrend = MarketTrend.BEAR;
            } else {
                // bull
                currentMarketTrend = MarketTrend.BULL;
            }

            currentPrice = latestPrice;
            requestRandomnessForNFTUris();
        }
    }

    //  ==== VRF randomness functions ====
    // request for random number (triggered by perform upkeep)
    function requestRandomnessForNFTUris() internal {
        // Will revert if subscription is not set and funded.
        s_requestId = COORDINATOR.requestRandomWords(
            keyHash,
            s_subscriptionId,
            3, //requestConfirmations
            2500000, //callbackGasLimit (2500000 is max)
            1 //numWords
        );
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        updateAllTokenUris(randomWords[0]);
    }

    // ==== pricefeed function ====
    function getLatestPrice() public view returns (int256) {
        (
            ,
            /* uint80 roundID */
            int256 price, /* uint startedAt */ /* uint timeStamp */ /* uint80 answeredInRound */
            ,
            ,

        ) = priceFeed.latestRoundData();
        // example price returned 3034715771688 = 30347.15771688 usd

        return price;
    }

    // === others ====
    // triggered by fulfillRandomWords
    function updateAllTokenUris(uint256 randomWord) internal {
        string[] memory urisForTrend = currentMarketTrend == MarketTrend.BULL
            ? bullUrisIpfs
            : bearUrisIpfs;

        for (uint256 i = 0; i < _tokenIdCounter.current(); i++) {
            _setTokenURI(
                i,
                urisForTrend[(randomWord / (i + 1)) % urisForTrend.length]
            );
        }
        string memory trend = currentMarketTrend == MarketTrend.BULL
            ? "bullish"
            : "bearish";
        emit TrendUpdated(trend);
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
