import path from "path";

export const workspaceRoot = path.resolve(__dirname, "..", "..", "..", "..");

export function resolveWorkspacePath(filePath: string): string {
  return path.isAbsolute(filePath) ? filePath : path.join(workspaceRoot, filePath);
}
