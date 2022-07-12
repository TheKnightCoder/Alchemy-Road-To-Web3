pragma solidity >=0.6.0 <0.7.0;

// import "./Staker.sol";

contract ExampleExternalContract {
    bool public completed;
    address public owner;
    bool private ownerSet;

    // Staker public stakerContract;

    modifier onlyOwner() {
        require(msg.sender == owner, "not the owner");
        _;
    }

    function setOwner(address newOwner) public {
        require(!ownerSet, "owner already set");
        ownerSet = true;
        owner = newOwner;
        // stakerContract = Staker(newOwner);
    }

    function complete() public payable onlyOwner {
        completed = true;
    }

    function withdraw() public {
        require(address(this).balance > 0, "not enough funds");
        completed = false;

        (bool sent, bytes memory data) = owner.call{ // dont need to cast as payable since you didn't use .transfer or .send but can still attach value
            value: address(this).balance
        }("");
        require(sent, "RIP; withdrawal failed :(");
    }
}
