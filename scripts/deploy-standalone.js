import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.testnet.arc.network";
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

async function main() {
  if (!PRIVATE_KEY) {
    console.error("Error: DEPLOYER_PRIVATE_KEY not found in .env.local");
    return;
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("Deploying ArcTrust with account:", wallet.address);

  const artifact = JSON.parse(fs.readFileSync("./artifacts/contracts/ArcTrust.sol/ArcTrust.json", "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  const contract = await factory.deploy();
  console.log("Waiting for deployment...");
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("ArcTrust deployed to:", address);
}

main().catch(console.error);
