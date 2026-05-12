// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title ArcTrust — On-Chain Reputation Score Storage
/// @notice Stores AI-computed trust scores (0-100) for wallet addresses on Arc Testnet
/// @dev Only the authorized updater address can write scores; anyone can read them
contract ArcTrust {

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public updater; // The authorized backend/AI address that can write scores

    struct ScoreData {
        uint256 score;       // 0-100
        uint256 lastUpdated; // Unix timestamp
    }

    mapping(address => ScoreData) private scores;
    address[] private scoredWallets; // Track all wallets that have been scored

    struct Deployment {
        address contractAddress;
        string templateName;
        uint256 timestamp;
        address deployer;
    }

    Deployment[] private deployments;
    mapping(address => uint256) public deployCount;

    // ─── Events ───────────────────────────────────────────────────────────────

    event ScoreUpdated(address indexed wallet, uint256 score, uint256 timestamp);
    event UpdaterChanged(address indexed oldUpdater, address indexed newUpdater);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event ContractDeployed(address indexed deployer, address indexed contractAddress, string templateName);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ArcTrust: not owner");
        _;
    }

    modifier onlyUpdater() {
        require(
            msg.sender == updater || msg.sender == owner,
            "ArcTrust: not authorized updater"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor() {
        owner   = msg.sender;
        updater = msg.sender; // Initially owner is also the updater
    }

    // ─── Write Functions ──────────────────────────────────────────────────────

    /// @notice Store or update the trust score for a wallet
    /// @param wallet  The wallet address to score
    /// @param score   Trust score (must be 0-100)
    function updateScore(address wallet, uint256 score) external onlyUpdater {
        require(wallet != address(0), "ArcTrust: zero address");
        require(score <= 100, "ArcTrust: score out of range");

        // Track new wallets
        if (scores[wallet].lastUpdated == 0) {
            scoredWallets.push(wallet);
        }

        scores[wallet] = ScoreData({ score: score, lastUpdated: block.timestamp });
        emit ScoreUpdated(wallet, score, block.timestamp);
    }

    /// @notice Record a new contract deployment
    /// @param _contractAddress The address of the deployed contract
    /// @param _templateName    The name of the template used (or 'Custom')
    function recordDeployment(address _contractAddress, string memory _templateName) external {
        require(_contractAddress != address(0), "ArcTrust: zero address");
        
        deployments.push(Deployment({
            contractAddress: _contractAddress,
            templateName: _templateName,
            timestamp: block.timestamp,
            deployer: msg.sender
        }));
        
        deployCount[msg.sender]++;
        
        emit ContractDeployed(msg.sender, _contractAddress, _templateName);
    }

    /// @notice Withdraw accumulated fees (owner only)
    function withdrawFees() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // ─── Read Functions ───────────────────────────────────────────────────────

    /// @notice Get the trust score for any wallet
    /// @param wallet The wallet address to query
    /// @return score The trust score (0-100), 0 if never scored
    /// @return lastUpdated Unix timestamp of last score update, 0 if never scored
    function getScore(address wallet) external view returns (uint256 score, uint256 lastUpdated) {
        ScoreData memory data = scores[wallet];
        return (data.score, data.lastUpdated);
    }

    /// @notice Check if a wallet has been scored
    function hasScore(address wallet) external view returns (bool) {
        return scores[wallet].lastUpdated > 0;
    }

    /// @notice Get total number of wallets scored
    function totalScored() external view returns (uint256) {
        return scoredWallets.length;
    }

    /// @notice Get a batch of scored wallet addresses (for leaderboard indexing)
    /// @param offset Starting index
    /// @param limit  Max results to return
    function getScoredWallets(uint256 offset, uint256 limit)
        external
        view
        returns (address[] memory)
    {
        uint256 total = scoredWallets.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = scoredWallets[i];
        }
        return result;
    }

    /// @notice Get total number of deployments recorded
    function totalDeployments() external view returns (uint256) {
        return deployments.length;
    }

    /// @notice Get recent deployments
    /// @param limit Max number of deployments to return
    function getRecentDeployments(uint256 limit)
        external
        view
        returns (Deployment[] memory)
    {
        uint256 total = deployments.length;
        uint256 count = limit > total ? total : limit;
        Deployment[] memory result = new Deployment[](count);
        
        for (uint256 i = 0; i < count; i++) {
            result[i] = deployments[total - 1 - i];
        }
        return result;
    }


    // ─── Admin Functions ──────────────────────────────────────────────────────

    /// @notice Change the authorized updater address
    function setUpdater(address newUpdater) external onlyOwner {
        require(newUpdater != address(0), "ArcTrust: zero address");
        emit UpdaterChanged(updater, newUpdater);
        updater = newUpdater;
    }

    /// @notice Transfer contract ownership
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "ArcTrust: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
