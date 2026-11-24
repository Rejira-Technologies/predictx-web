import { describe, it, expect } from "vitest";
import { parseStellarNetwork } from "@/lib/constants";

describe("parseStellarNetwork", () => {
  it("defaults to testnet when undefined or empty", () => {
    expect(parseStellarNetwork()).toBe("testnet");
    expect(parseStellarNetwork("")).toBe("testnet");
  });

  it("parses valid networks", () => {
    expect(parseStellarNetwork("testnet")).toBe("testnet");
    expect(parseStellarNetwork("mainnet")).toBe("mainnet");
  });

  it("throws on invalid network names", () => {
    expect(() => parseStellarNetwork("Mainnet")).toThrow(
      'Invalid NEXT_PUBLIC_STELLAR_NETWORK: "Mainnet". Allowed values are "testnet" or "mainnet".'
    );
    expect(() => parseStellarNetwork("production")).toThrow(
      'Invalid NEXT_PUBLIC_STELLAR_NETWORK: "production". Allowed values are "testnet" or "mainnet".'
    );
    expect(() => parseStellarNetwork("mainnet ")).toThrow(
      'Invalid NEXT_PUBLIC_STELLAR_NETWORK: "mainnet ". Allowed values are "testnet" or "mainnet".'
    );
  });
});
