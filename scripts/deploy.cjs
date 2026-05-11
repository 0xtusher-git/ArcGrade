const hre = require("hardhat");

async function main() {
  console.log("Deploying ArcTrust contract to Arc Testnet...");

  const ArcTrust = await hre.ethers.getContractFactory("ArcTrust");
  const contract = await ArcTrust.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ArcTrust deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
