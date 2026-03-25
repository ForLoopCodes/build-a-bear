const base = require("../../jest.base.config.cjs");

module.exports = {
  ...base,
  rootDir: ".",
  moduleNameMapper: {
    "^@build-a-bear/core$": "<rootDir>/../../packages/core/src",
  },
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tests/tsconfig.json",
    },
  },
  testMatch: ["<rootDir>/tests/**/*.test.ts"],
};
