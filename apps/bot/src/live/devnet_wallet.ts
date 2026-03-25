import { Connection, Keypair, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { existsSync, readFileSync } from "fs";

export type DevnetWalletContext = {
  connection: Connection;
  keypair: Keypair;
  publicKey: PublicKey;
};

function loadKeypairFromJson(path: string): Keypair {
  if (!existsSync(path)) {
    throw new Error(`Keypair file not found at ${path}`);
  }
  const raw = JSON.parse(readFileSync(path, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(raw));
}

export function createDevnetWalletContext(keypairPath: string): DevnetWalletContext {
  const keypair = loadKeypairFromJson(keypairPath);
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  return {
    connection,
    keypair,
    publicKey: keypair.publicKey,
  };
}

export async function fetchDevnetSolBalance(context: DevnetWalletContext): Promise<number> {
  const lamports = await context.connection.getBalance(context.publicKey, "confirmed");
  return lamports / 1_000_000_000;
}
