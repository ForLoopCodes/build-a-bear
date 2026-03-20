import type { BN } from "bn.js";
import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import { SOLANA_RPC } from "../config.js";
import { Position, DRIFT_MARKETS, DRIFT_PROGRAM_ID } from "../types.js";

export class DriftAdaptor {
  private connection: Connection;
  private wallet: Keypair;
  private programId: PublicKey;

  constructor(keypair: Keypair) {
    this.connection = new Connection(SOLANA_RPC, "confirmed");
    this.wallet = keypair;
    this.programId = DRIFT_PROGRAM_ID;
  }

  async openPosition(marketIndex: number, direction: "long" | "short", size: BN): Promise<string> {
    const data = Buffer.alloc(12);
    data.writeUInt8(1, 0);
    data.writeUInt32LE(marketIndex, 4);
    data.writeBigInt64LE(BigInt(size.toString()), 8);
    const ix = { programId: this.programId, keys: [], data };
    const tx = new Transaction().add(ix);
    tx.feePayer = this.wallet.publicKey;
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    const signed = await this.wallet.signTransaction(tx);
    return await this.connection.sendRawTransaction(signed.serialize());
  }

  async closePosition(marketIndex: number): Promise<string> {
    const data = Buffer.alloc(9);
    data.writeUInt8(2, 0);
    data.writeUInt32LE(marketIndex, 1);
    const ix = { programId: this.programId, keys: [], data };
    const tx = new Transaction().add(ix);
    tx.feePayer = this.wallet.publicKey;
    const { blockhash } = await this.connection.getLatestBlockhash();
    tx.recentBlockhash = blockhash;
    const signed = await this.wallet.signTransaction(tx);
    return await this.connection.sendRawTransaction(signed.serialize());
  }

  async closeAllPositions(): Promise<string[]> {
    const sigs: string[] = [];
    for (const m of DRIFT_MARKETS) {
      try {
        const sig = await this.closePosition(m.driftMarketIndex);
        sigs.push(sig);
      } catch { }
    }
    return sigs;
  }

  getPositions(): Position[] {
    return [];
  }

  async getMarketFundingRate(marketIndex: number): Promise<BN> {
    return new BN(0);
  }

  getAccountPnl(): BN {
    return new BN(0);
  }

  getTotalPositionValue(): BN {
    return new BN(0);
  }

  getAccountHealth(): number {
    return 100;
  }
}
