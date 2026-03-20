import axios from "axios";
import { BN } from "bn.js";
import { RANGER_API_URL } from "../config.js";
import { VAULT_PROGRAM_ID } from "../types.js";

export class RangerApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(apiKey: string, baseUrl: string = RANGER_API_URL) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  async getAllVaults(): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/v1/vaults`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10000,
    });
    return response.data?.vaults || [];
  }

  async getVault(vaultAddress: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/v1/vault/${vaultAddress}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10000,
    });
    return response.data?.vault;
  }

  async getVaultPositions(vaultAddress: string): Promise<any[]> {
    const response = await axios.get(`${this.baseUrl}/v1/vault/${vaultAddress}/positions`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10000,
    });
    return response.data?.positions || [];
  }

  async getVaultPerformance(vaultAddress: string, period: string = "30d"): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/v1/vault/${vaultAddress}/performance`, {
      params: { period },
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10000,
    });
    return response.data;
  }

  async getVaultFees(vaultAddress: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/v1/vault/${vaultAddress}/fees`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      timeout: 10000,
    });
    return response.data;
  }

  async submitVaultStrategy(vaultAddress: string, strategyData: any): Promise<any> {
    const response = await axios.post(
      `${this.baseUrl}/v1/vault/${vaultAddress}/strategy`,
      strategyData,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    return response.data;
  }

  buildVaultAddress(name: string, manager: string): string {
    const seed = Buffer.from(`${name}:${manager}`).toString("base64");
    return `${VAULT_PROGRAM_ID.toBase58()}:${seed}`;
  }
}
