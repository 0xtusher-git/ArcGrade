export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  code: string;
}

export const CONTRACT_TEMPLATES: ContractTemplate[] = [
  {
    id: 'simple-storage',
    name: 'Simple Storage',
    description: 'A classic smart contract that allows you to store and retrieve a number on the blockchain.',
    difficulty: 'Easy',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SimpleStorage
 * @dev Stores and retrieves a value on-chain
 */
contract SimpleStorage {
    uint256 private value;

    event ValueChanged(uint256 newValue);

    function set(uint256 _value) public {
        value = _value;
        emit ValueChanged(_value);
    }

    function get() public view returns (uint256) {
        return value;
    }
}`,
  },
  {
    id: 'token-counter',
    name: 'Token Counter',
    description: 'Keep track of interactions per wallet address. Perfect for loyalty or simple voting points.',
    difficulty: 'Easy',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TokenCounter {
    mapping(address => uint256) public counts;

    event Incremented(address indexed user, uint256 newCount);

    function increment() public {
        counts[msg.sender]++;
        emit Incremented(msg.sender, counts[msg.sender]);
    }

    function getMyCount() public view returns (uint256) {
        return counts[msg.sender];
    }
}`,
  },
  {
    id: 'hello-world',
    name: 'Hello World',
    description: 'Leave your mark on the Arc Testnet by storing a custom greeting message in a string.',
    difficulty: 'Easy',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HelloWorld {
    string public message = "Hello Arc!";

    event MessageUpdated(string newMessage);

    function setMessage(string memory _message) public {
        message = _message;
        emit MessageUpdated(_message);
    }
}`,
  },
  {
    id: 'basic-vault',
    name: 'Basic Vault',
    description: 'Lock and unlock native USDC on-chain. Demonstrates payable functions and value transfers.',
    difficulty: 'Medium',
    code: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BasicVault {
    address public owner;
    uint256 public totalLocked;

    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        require(msg.value > 0, "Amount must be > 0");
        totalLocked += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function withdraw() public {
        uint256 amount = totalLocked;
        require(amount > 0, "No funds to withdraw");
        
        totalLocked = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}`,
  },
];
