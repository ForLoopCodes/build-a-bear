import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from "@solana/web3.js";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

type SmartWalletStore = Record<string, number[]>;

function readKeypair(pathToFile: string): Keypair {
  const payload = JSON.parse(readFileSync(pathToFile, "utf-8")) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(payload));
}

function ensureAuthorityKeypair(pathToFile: string): Keypair {
  if (existsSync(pathToFile)) {
    return readKeypair(pathToFile);
  }

  mkdirSync(path.dirname(pathToFile), { recursive: true });
  const generated = Keypair.generate();
  writeFileSync(pathToFile, JSON.stringify(Array.from(generated.secretKey), null, 2), "utf-8");
  return generated;
}

function loadSmartWalletStore(storePath: string): SmartWalletStore {
  if (!existsSync(storePath)) {
    return {};
  }
  return JSON.parse(readFileSync(storePath, "utf-8")) as SmartWalletStore;
}

function saveSmartWalletStore(storePath: string, store: SmartWalletStore): void {
  mkdirSync(path.dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(store, null, 2), "utf-8");
}

export class WalletService {
  private connection: Connection;
  private botAuthority: Keypair;
  private smartWalletStorePath: string;
  private smartWalletStore: SmartWalletStore;

  constructor(authorityKeypairPath?: string, rpcUrl?: string, smartWalletStorePath?: string) {
    this.connection = new Connection(rpcUrl ?? clusterApiUrl("devnet"), "confirmed");
    this.botAuthority = ensureAuthorityKeypair(
      authorityKeypairPath ?? path.join(process.cwd(), "ml", "output", "bot_authority_keypair.json"),
    );
    this.smartWalletStorePath = smartWalletStorePath ??
      path.join(process.cwd(), "ml", "output", "user_smart_wallets.json");
    this.smartWalletStore = loadSmartWalletStore(this.smartWalletStorePath);
  }

  private getOrCreateUserSmartWallet(wallet: string): Keypair {
    if (!wallet) {
      throw new Error("wallet is required");
    }

    const existing = this.smartWalletStore[wallet];
    if (existing) {
      return Keypair.fromSecretKey(Uint8Array.from(existing));
    }

    const generated = Keypair.generate();
    this.smartWalletStore[wallet] = Array.from(generated.secretKey);
    saveSmartWalletStore(this.smartWalletStorePath, this.smartWalletStore);
    return generated;
  }

  getBotAuthorityPublicKey(): string {
    return this.botAuthority.publicKey.toBase58();
  }

  getOrCreateUserDepositAddress(wallet: string): string {
    return this.getOrCreateUserSmartWallet(wallet).publicKey.toBase58();
  }

  async getBotBalanceSol(): Promise<number> {
    const lamports = await this.connection.getBalance(this.botAuthority.publicKey, "confirmed");
    return lamports / LAMPORTS_PER_SOL;
  }

  async getUserDepositBalanceSol(wallet: string): Promise<number> {
    const userWallet = this.getOrCreateUserSmartWallet(wallet);
    const lamports = await this.connection.getBalance(userWallet.publicKey, "confirmed");
    return lamports / LAMPORTS_PER_SOL;
  }

  async sweepUserDeposit(wallet: string): Promise<{ signature: string | null; amountSol: number }> {
    const userWallet = this.getOrCreateUserSmartWallet(wallet);
    const balanceLamports = await this.connection.getBalance(userWallet.publicKey, "confirmed");
    if (balanceLamports <= 10_000) {
      return { signature: null, amountSol: 0 };
    }

    const transferable = balanceLamports - 10_000;
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: userWallet.publicKey,
        toPubkey: this.botAuthority.publicKey,
        lamports: transferable,
      }),
    );

    const signature = await this.connection.sendTransaction(transaction, [userWallet]);
    await this.connection.confirmTransaction(signature, "confirmed");
    return {
      signature,
      amountSol: transferable / LAMPORTS_PER_SOL,
    };
  }

  async sendClaimSol(targetWallet: string, amountSol: number): Promise<string> {
    if (amountSol <= 0) {
      throw new Error("Claim amount must be positive");
    }

    const destination = new PublicKey(targetWallet);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.botAuthority.publicKey,
        toPubkey: destination,
        lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
      }),
    );

    const signature = await this.connection.sendTransaction(transaction, [this.botAuthority]);
    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}
