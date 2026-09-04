import * as vscode from "vscode";

export interface WrapperPayload {
  title: string;
  description: string;
  ulids: string[];
  gated: boolean;
  created_at?: string;
  canvases?: string[];
  assets?: Record<string, string>;
}

export class BrainShareApi {
  constructor(
    private readonly baseUrl: string,
    private readonly token: string
  ) {}

  private headers(contentType?: string): Record<string, string> {
    return {
      ...(contentType ? { "content-type": contentType } : {}),
      authorization: `Bearer ${this.token}`,
      "user-agent": "brainshare-vscode/0.1",
    };
  }

  private url(path: string): string {
    return `${this.baseUrl.replace(/\/$/, "")}${path}`;
  }

  async publishNote(id: string, path: string, markdown: string): Promise<{ url: string }> {
    const res = await fetch(this.url(`/api/notes/${id}`), {
      method: "PUT",
      headers: { ...this.headers("text/markdown"), "x-note-path": path },
      body: markdown,
    });
    if (!res.ok) throw await apiError("publish note", res);
    const data = await res.json() as { url?: string };
    return { url: data.url ?? this.url(`/${id}`) };
  }

  async unpublishNote(id: string): Promise<void> {
    const res = await fetch(this.url(`/api/notes/${id}`), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) throw await apiError("unpublish note", res);
  }

  async getWrapper(id: string): Promise<WrapperPayload | null> {
    const res = await fetch(this.url(`/api/wrappers/${encodeURIComponent(id)}`), {
      headers: this.headers(),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw await apiError("read slice", res);
    return await res.json() as WrapperPayload;
  }

  async publishWrapper(id: string, payload: WrapperPayload): Promise<{ url: string }> {
    const res = await fetch(this.url(`/api/wrappers/${encodeURIComponent(id)}`), {
      method: "PUT",
      headers: this.headers("application/json"),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await apiError("publish slice", res);
    const data = await res.json() as { url?: string };
    return { url: data.url ?? this.url(`/share/${id}`) };
  }

  async deleteWrapper(id: string): Promise<void> {
    const res = await fetch(this.url(`/api/wrappers/${encodeURIComponent(id)}`), {
      method: "DELETE",
      headers: this.headers(),
    });
    if (!res.ok && res.status !== 404) throw await apiError("delete slice", res);
  }

  async mintToken(id: string, options: { expDays?: number; maxViews?: number; viewer?: string }): Promise<{ url: string; jti: string; exp: number }> {
    const body: Record<string, unknown> = { exp_days: options.expDays ?? 7 };
    if (options.maxViews !== undefined) body.max_views = options.maxViews;
    if (options.viewer) body.viewer = options.viewer;
    const res = await fetch(this.url(`/api/wrappers/${encodeURIComponent(id)}/tokens`), {
      method: "POST",
      headers: this.headers("application/json"),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw await apiError("mint access token", res);
    return await res.json() as { url: string; jti: string; exp: number };
  }

  async revokeToken(id: string, jti: string): Promise<void> {
    const res = await fetch(this.url(`/api/wrappers/${encodeURIComponent(id)}/revoke`), {
      method: "POST",
      headers: this.headers("application/json"),
      body: JSON.stringify({ jti }),
    });
    if (!res.ok) throw await apiError("revoke access token", res);
  }
}

async function apiError(action: string, res: Response): Promise<Error> {
  const body = (await res.text()).slice(0, 300);
  return new Error(`BrainShare could not ${action} (${res.status}): ${body || res.statusText}`);
}

export async function apiFromSettings(context: vscode.ExtensionContext): Promise<BrainShareApi> {
  const config = vscode.workspace.getConfiguration("brainshare");
  const baseUrl = config.get<string>("publisherUrl", "").trim();
  const token = await context.secrets.get("brainshare.publisherToken");
  if (!baseUrl || !token) {
    throw new Error("BrainShare is not configured. Run “BrainShare: Configure Publisher” first.");
  }
  return new BrainShareApi(baseUrl, token);
}
