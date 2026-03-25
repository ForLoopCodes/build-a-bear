import { corePackageName, identity } from "../src";

describe("core package scaffolding", () => {
  it("exports package name", () => {
    expect(corePackageName).toBe("@build-a-bear/core");
  });

  it("returns identity values", () => {
    expect(identity(42)).toBe(42);
    expect(identity("vault")).toBe("vault");
  });
});
