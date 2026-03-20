import dotenv from "dotenv";
import { Keypair } from "@solana/web3.js";
import { DriftPackVault } from "../src/vault.js";
import { MonitoringDashboard } from "../src/monitoring/dashboard.js";
import { config } from "../src/config.js";

dotenv.config();

async function main() {
  const apiKey = process.env.RANGER_API_KEY;
  if (!apiKey) {
    console.error("RANGER_API_KEY not set");
    process.exit(1);
  }

  const privateKeyBase58 = process.env.WALLET_PRIVATE_KEY;
  if (!privateKeyBase58) {
    console.error("WALLET_PRIVATE_KEY not set");
    process.exit(1);
  }

  const secretKeyArray = Uint8Array.from(atob(privateKeyBase58), (c) => c.charCodeAt(0));
  const keypair = Keypair.fromSecretKey(secretKeyArray);

  const vault = new DriftPackVault(apiKey);
  const dashboard = new MonitoringDashboard(vault.getState(), config.risk);

  try {
    await vault.initialize(keypair);
    console.log(`Vault initialized for wallet: ${keypair.publicKey.toBase58()}`);

    const marketData = await vault.scanFundingRates();
    console.log(`Scanned ${marketData.length} markets`);
    for (const m of marketData) {
      console.log(`  ${m.symbol}: ${m.fundingRateAnnualized.toFixed(2)}% APY | OI: $${(Number(m.openInterest) / 1e6).toFixed(0)}`);
    }

    vault.run();

    setInterval(() => {
      dashboard.update(vault.getState());
      console.log(dashboard.render());
    }, 30_000);

  } catch (err) {
    console.error("Deployment error:", err);
    process.exit(1);
  }
}

main().catch(console.error);
