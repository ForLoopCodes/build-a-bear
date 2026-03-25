const base = require("../../jest.base.config.cjs");

module.exports = {
  ...base,
  rootDir: ".",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tests/tsconfig.json",
    },
  },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
};
