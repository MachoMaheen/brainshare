import type { CompiledSliceV1 } from "@brainshare/protocol";
export interface PublisherClientOptions { baseUrl:string; token:string; fetchImpl?:typeof fetch; }
export class BrainSharePublisherClient {
  private readonly base:string; private readonly token:string; private readonly f:typeof fetch;
  constructor(o:PublisherClientOptions){this.base=o.baseUrl.replace(/\/$/,"");this.token=o.token;this.f=o.fetchImpl??fetch;if(!/^https?:\/\//.test(this.base))throw new Error("Publisher URL must be HTTP(S)");}
  private headers(contentType?:string):Record<string,string>{return{...(contentType?{"content-type":contentType}:{}),authorization:`Bearer ${this.token}`,"user-agent":"brainshare-sdk/0.1"};}
  async publishNote(id:string,path:string,markdown:string){const r=await this.f(`${this.base}/api/notes/${id}`,{method:"PUT",headers:{...this.headers("text/markdown"),"x-note-path":path},body:markdown});return this.json(r,"publish note") as Promise<{url:string}>;}
  async publishSlice(slice:CompiledSliceV1){const r=await this.f(`${this.base}/api/wrappers/${encodeURIComponent(slice.id)}`,{method:"PUT",headers:this.headers("application/json"),body:JSON.stringify({title:slice.title,description:slice.description,ulids:slice.files.map(f=>f.id),gated:slice.visibility==="gated",created_at:slice.createdAt,brainshare:{protocol:slice.protocol,revision:slice.revision,entrypoint:slice.entrypoint,live:slice.live}})});return this.json(r,"publish slice") as Promise<{url:string}>;}
  async mintToken(id:string,o:{expDays?:number;maxViews?:number;viewer?:string}={}){const r=await this.f(`${this.base}/api/wrappers/${encodeURIComponent(id)}/tokens`,{method:"POST",headers:this.headers("application/json"),body:JSON.stringify({exp_days:o.expDays??7,...(o.maxViews?{max_views:o.maxViews}:{}),...(o.viewer?{viewer:o.viewer}:{})})});return this.json(r,"mint token") as Promise<{url:string;jti:string;exp:number}>;}
  private async json(r:Response,action:string){const text=await r.text();if(!r.ok)throw new Error(`BrainShare could not ${action} (${r.status}): ${text.slice(0,300)}`);return text?JSON.parse(text):{};}
}
