import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, clusterApiUrl } from "@solana/web3.js";
import { existsSync, readFileSync } from "fs";

function loadKeypair(path: string): Keypair {
  if (!existsSync(path)) {
    throw new Error(`Bot keypair file not found at ${path}`);
  }
  const data = JSON.parse(readFileSync(path, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(data));
}

export class WalletService {
  private connection: Connection;
  private botKeypair: Keypair;

  constructor(keypairPath: string, rpcUrl?: string) {
    this.connection = new Connection(rpcUrl ?? clusterApiUrl("devnet"), "confirmed");
    this.botKeypair = loadKeypair(keypairPath);
  }

  getBotPublicKey(): string {
    return this.botKeypair.publicKey.toBase58();
  }

  async getBotBalanceSol(): Promise<number> {
    const lamports = await this.connection.getBalance(this.botKeypair.publicKey, "confirmed");
    return lamports / LAMPORTS_PER_SOL;
  }

  async sendClaimSol(targetWallet: string, amountSol: number): Promise<string> {
    if (amountSol <= 0) {
      throw new Error("Claim amount must be positive");
    }

    const destination = new PublicKey(targetWallet);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.botKeypair.publicKey,
        toPubkey: destination,
        lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
      }),
    );

    const signature = await this.connection.sendTransaction(transaction, [this.botKeypair]);
    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}
