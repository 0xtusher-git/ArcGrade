const hre = require("hardhat");

async function main() {
  console.log("Deploying ArcGrade contract to Arc Testnet...");

  const ArcGrade = await hre.ethers.getContractFactory("ArcGrade");
  const contract = await ArcGrade.deploy();

  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ArcGrade deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
