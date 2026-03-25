import { clusterApiUrl, Keypair } from "@solana/web3.js";
import { mkdirSync, writeFileSync, unlinkSync } from "fs";
import path from "path";
import { createDevnetWalletContext } from "../src/live";

describe("devnet wallet context", () => {
  it("loads keypair and devnet connection", () => {
    const keypair = Keypair.generate();
    const outputDir = path.join(process.cwd(), "..", "..", "ml", "output");
    mkdirSync(outputDir, { recursive: true });
    const filePath = path.join(outputDir, "test_devnet_keypair.json");
    writeFileSync(filePath, JSON.stringify(Array.from(keypair.secretKey)), "utf-8");

    const context = createDevnetWalletContext(filePath);
    expect(context.publicKey.toBase58()).toBe(keypair.publicKey.toBase58());
    expect(context.connection.rpcEndpoint).toContain(clusterApiUrl("devnet"));

    unlinkSync(filePath);
  });
});
