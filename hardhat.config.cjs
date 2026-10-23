require("@nomicfoundation/hardhat-ethers");
require("dotenv").config({ path: ".env.local" });

module.exports = {
  solidity: "0.8.20",
  networks: {
    arc: {
      url: process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.mainnet.arc.io",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 5042
    }
  }
};
