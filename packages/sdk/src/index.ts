import type { CompiledSliceV1 } from "@brainshare/protocol";

export interface WrapperPayload {
  title: string; description: string; ulids: string[]; gated: boolean; created_at?: string; canvases?: string[]; assets?: Record<string,string>;
  brainshare?: { protocol?: number; revision?: string; entrypoint?: string; live?: boolean };
}
export interface PublisherClientOptions { baseUrl:string; token:string; fetchImpl?:typeof fetch; }
export class BrainSharePublisherClient {
  private readonly base:string; private readonly token:string; private readonly f:typeof fetch;
  constructor(o:PublisherClientOptions){this.base=o.baseUrl.replace(/\/$/,"");this.token=o.token;this.f=o.fetchImpl??fetch;if(!/^https?:\/\//.test(this.base))throw new Error("Publisher URL must be HTTP(S)");}
  private headers(contentType?:string):Record<string,string>{return{...(contentType?{"content-type":contentType}:{}),authorization:`Bearer ${this.token}`,"user-agent":"brainshare-sdk/0.1"};}
  private url(path:string){return `${this.base}${path}`;}
  async publishNote(id:string,path:string,markdown:string){const r=await this.f(this.url(`/api/notes/${id}`),{method:"PUT",headers:{...this.headers("text/markdown"),"x-note-path":encodeURIComponent(path)},body:markdown});return this.json(r,"publish note") as Promise<{url:string}>;}
  async unpublishNote(id:string):Promise<void>{const r=await this.f(this.url(`/api/notes/${id}`),{method:"DELETE",headers:this.headers()});if(!r.ok&&r.status!==404)await this.fail(r,"unpublish note");}
  async getWrapper(id:string):Promise<WrapperPayload|null>{const r=await this.f(this.url(`/api/wrappers/${encodeURIComponent(id)}`),{headers:this.headers()});if(r.status===404)return null;return this.json(r,"read slice") as Promise<WrapperPayload>;}
  async publishWrapper(id:string,payload:WrapperPayload){const r=await this.f(this.url(`/api/wrappers/${encodeURIComponent(id)}`),{method:"PUT",headers:this.headers("application/json"),body:JSON.stringify(payload)});return this.json(r,"publish slice") as Promise<{url:string}>;}
  async publishSlice(slice:CompiledSliceV1){return this.publishWrapper(slice.id,{title:slice.title,description:slice.description,ulids:slice.files.map(f=>f.id),gated:slice.visibility==="gated",created_at:slice.createdAt,brainshare:{protocol:slice.protocol,revision:slice.revision,entrypoint:slice.entrypoint,live:slice.live}});}
  async deleteWrapper(id:string):Promise<void>{const r=await this.f(this.url(`/api/wrappers/${encodeURIComponent(id)}`),{method:"DELETE",headers:this.headers()});if(!r.ok&&r.status!==404)await this.fail(r,"delete slice");}
  async mintToken(id:string,o:{expDays?:number;maxViews?:number;viewer?:string}={}){const r=await this.f(this.url(`/api/wrappers/${encodeURIComponent(id)}/tokens`),{method:"POST",headers:this.headers("application/json"),body:JSON.stringify({exp_days:o.expDays??7,...(o.maxViews!==undefined?{max_views:o.maxViews}:{}),...(o.viewer?{viewer:o.viewer}:{})})});return this.json(r,"mint token") as Promise<{url:string;jti:string;exp:number}>;}
  async revokeToken(id:string,jti:string):Promise<void>{const r=await this.f(this.url(`/api/wrappers/${encodeURIComponent(id)}/revoke`),{method:"POST",headers:this.headers("application/json"),body:JSON.stringify({jti})});if(!r.ok)await this.fail(r,"revoke token");}
  private async fail(r:Response,action:string):Promise<never>{const text=await r.text();throw new Error(`BrainShare could not ${action} (${r.status}): ${text.slice(0,300)}`);}
  private async json(r:Response,action:string){if(!r.ok)return this.fail(r,action);const text=await r.text();return text?JSON.parse(text):{};}
}
