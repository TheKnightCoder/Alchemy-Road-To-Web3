//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Casino {
    struct ProposedBet {
        address sideA;
        uint256 value;
        uint256 placedAt;
        uint256 randomA;
        bool accepted;
    } // struct ProposedBet

    struct AcceptedBet {
        address sideB;
        uint256 acceptedAt;
        uint256 commitmentB;
        uint256 randomB;
    } // struct AcceptedBet

    // Proposed bets, keyed by the commitment value
    mapping(uint256 => ProposedBet) public proposedBet;

    // Accepted bets, also keyed by commitment value
    mapping(uint256 => AcceptedBet) public acceptedBet;

    event BetProposed(uint256 indexed _commitment, uint256 value);

    event BetAccepted(uint256 indexed _commitment, address indexed _sideA);

    event BetSettled(
        uint256 indexed _commitment,
        address winner,
        address loser,
        uint256 value
    );

    // Called by sideA to start the process
    function proposeBet(uint256 _commitment) external payable {
        require(
            proposedBet[_commitment].value == 0,
            "there is already a bet on that commitment"
        );
        require(msg.value > 0, "you need to actually bet something");

        proposedBet[_commitment].sideA = msg.sender;
        proposedBet[_commitment].value = msg.value;
        proposedBet[_commitment].placedAt = block.timestamp;
        // accepted is false by default

        emit BetProposed(_commitment, msg.value);
    } // function proposeBet

    // Called by sideB to continue
    function acceptBet(uint256 _commitmentA, uint256 _commitmentB)
        external
        payable
    {
        require(
            !proposedBet[_commitmentA].accepted,
            "Bet has already been accepted"
        );
        require(
            proposedBet[_commitmentA].sideA != address(0),
            "Nobody made that bet"
        );
        require(
            msg.value == proposedBet[_commitmentA].value,
            "Need to bet the same amount as sideA"
        );

        acceptedBet[_commitmentA].sideB = msg.sender;
        acceptedBet[_commitmentA].acceptedAt = block.timestamp;
        acceptedBet[_commitmentA].commitmentB = _commitmentB;
        proposedBet[_commitmentA].accepted = true;

        emit BetAccepted(_commitmentA, proposedBet[_commitmentA].sideA);
    } // function acceptBet

    //revealA stores number into proposedBet[_commitment].randomA
    function revealA(uint256 _random) external {
        uint256 _commitment = uint256(keccak256(abi.encodePacked(_random)));
        proposedBet[_commitment].randomA = _random;
    }

    //revealB stores number into acceptedBet[_commitment].randomB
    function revealB(uint256 _commitmentA, uint256 _random) external {
        uint256 _commitmentB = uint256(keccak256(abi.encodePacked(_random)));
        require(
            _commitmentB == acceptedBet[_commitmentA].commitmentB,
            "wrong number hashes do not match"
        );
        acceptedBet[_commitmentA].randomB = _random;
    }

    // Called by any side to reveal their random value and conclude the bet
    function claim(uint256 _commitment) external {
        address payable _sideA = payable(proposedBet[_commitment].sideA);
        address payable _sideB = payable(acceptedBet[_commitment].sideB);
        uint256 _agreedRandom = proposedBet[_commitment].randomA ^
            acceptedBet[_commitment].randomB;
        uint256 _value = proposedBet[_commitment].value;

        require(
            proposedBet[_commitment].sideA == msg.sender,
            "Not a bet you placed or wrong value"
        );
        require(
            proposedBet[_commitment].accepted,
            "Bet has not been accepted yet"
        );

        // Pay and emit an event
        if (_agreedRandom % 2 == 0) {
            // sideA wins
            _sideA.transfer(2 * _value);
            emit BetSettled(_commitment, _sideA, _sideB, _value);
        } else {
            // sideB wins
            _sideB.transfer(2 * _value);
            emit BetSettled(_commitment, _sideB, _sideA, _value);
        }

        // Cleanup
        delete proposedBet[_commitment];
        delete acceptedBet[_commitment];
    } // function reveal
} // contract Casino
