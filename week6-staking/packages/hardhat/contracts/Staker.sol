pragma solidity >=0.6.0 <0.7.0;

import "hardhat/console.sol";
import "./ExampleExternalContract.sol";

contract Staker {
    event Stake(address indexed sender, uint256 amount);
    event Received(address, uint256);
    event Execute(address indexed sender, uint256 amount);

    ExampleExternalContract public exampleExternalContract;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public depositTimestamps;

    uint256 public withdrawalDeadline = block.timestamp + 120 seconds;
    uint256 public claimDeadline = block.timestamp + 240 seconds;
    uint256 public currentBlock = 0;

    modifier withdrawalDeadlineReached(bool requireReached) {
        uint256 timeRemaining = withdrawalTimeLeft();
        if (requireReached) {
            require(timeRemaining == 0, "Withdrawal period is not reached yet");
        } else {
            require(timeRemaining > 0, "Withdrawal period has been reached");
        }
        _;
    }

    modifier claimDeadlineReached(bool requireReached) {
        uint256 timeRemaining = claimPeriodLeft();
        if (requireReached) {
            require(timeRemaining == 0, "Claim period is not reached yet");
        } else {
            require(timeRemaining > 0, "Claim period has been reached");
        }
        _;
    }

    modifier notCompleted() {
        bool completed = exampleExternalContract.completed();
        require(!completed, "Stake already completed!");
        _;
    }

    constructor(address exampleExternalContractAddress) public {
        exampleExternalContract = ExampleExternalContract(
            exampleExternalContractAddress
        );
    }

    function withdrawalTimeLeft()
        public
        view
        returns (uint256 withdrawalTimeLeft)
    {
        if (block.timestamp >= withdrawalDeadline) {
            return (0);
        } else {
            return (withdrawalDeadline - block.timestamp);
        }
    }

    function claimPeriodLeft() public view returns (uint256 claimPeriodLeft) {
        if (block.timestamp >= claimDeadline) {
            return (0);
        } else {
            return (claimDeadline - block.timestamp);
        }
    }

    function stake()
        public
        payable
        withdrawalDeadlineReached(false)
        claimDeadlineReached(false)
    {
        balances[msg.sender] = balances[msg.sender] + msg.value;
        depositTimestamps[msg.sender] = block.timestamp;
        emit Stake(msg.sender, msg.value);
    }

    function stakeEarnings(address someAddress) public view returns (uint256) {
        return
            balances[someAddress] +
            (2 wei **
                (0.001 * (block.timestamp - depositTimestamps[someAddress])));
    }

    function withdraw()
        public
        withdrawalDeadlineReached(true)
        claimDeadlineReached(false)
        notCompleted
    {
        require(balances[msg.sender] > 0, "You have no balance to withdraw!");
        uint256 individualBalance = balances[msg.sender];
        uint256 indBalanceRewards = stakeEarnings(msg.sender);

        // Transfer all ETH via call! (not transfer) cc: https://solidity-by-example.org/sending-ether
        (bool sent, bytes memory data) = msg.sender.call{
            value: indBalanceRewards
        }("");
        // the argument for using this aposed to .transfer or .send is that they forward a limited 2300 gas,
        // gas codes for opcodes can increase such as in EIP-1884, therefore an unspecified sender.call protects against that
        // argument for using .transfer/.send is that the 2300 gas limit can protect against re-entrance attacks as gas is limited.
        // https://medium.com/consensys-diligence/stop-using-soliditys-transfer-now-b1b6d2d00faf
        // https://fravoll.github.io/solidity-patterns/secure_ether_transfer.html
        // conclusion use call.value when fallback is needed / or more than 2300 gas needs to be send (in this case I think transfer is fine)
        // the Constantinople fork was delayed because lowering gas costs caused code that was previously safe from reentrancy to no longer be.

        // transfer (2300 gas limit, throws error)
        // send (2300 gas, returns bool)
        // call (specify amount gas, returns bool, bytes) [or call.value]
        require(sent, "RIP; withdrawal failed :(");
    }

    function execute() public claimDeadlineReached(true) notCompleted {
        uint256 contractBalance = address(this).balance;
        exampleExternalContract.complete{value: contractBalance}();
    }

    function killTime() public {
        currentBlock = block.timestamp;
    }

    receive() external payable {
        withdrawalDeadline = block.timestamp + 120 seconds;
        claimDeadline = block.timestamp + 240 seconds;
        emit Received(msg.sender, msg.value);
    }
}
