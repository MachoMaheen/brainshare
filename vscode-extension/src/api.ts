import * as vscode from "vscode";
import { BrainSharePublisherClient, type WrapperPayload } from "@brainshare/sdk";

export type { WrapperPayload };

/** Thin VS Code adapter over the editor-neutral BrainShare publisher SDK. */
export class BrainShareApi extends BrainSharePublisherClient {
  constructor(baseUrl: string, token: string) {
    super({ baseUrl, token });
  }
}

/** SecretStorage is extension-global, while publisherUrl is workspace-scoped. */
export function publisherTokenSecretKey(): string {
  const root = vscode.workspace.workspaceFolders?.[0]?.uri.toString(true) ?? "no-workspace";
  return `brainshare.publisherToken:${root}`;
}

export async function apiFromSettings(context: vscode.ExtensionContext): Promise<BrainShareApi> {
  const config = vscode.workspace.getConfiguration("brainshare");
  const baseUrl = config.get<string>("publisherUrl", "").trim();
  const token = await context.secrets.get(publisherTokenSecretKey());
  if (!baseUrl || !token) throw new Error("BrainShare is not configured for this workspace. Run “BrainShare: Configure Publisher” first.");
  return new BrainShareApi(baseUrl, token);
}
