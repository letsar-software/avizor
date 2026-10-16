import test from "node:test";
import assert from "node:assert/strict";
import { requireConsultationInteraction } from "../lib/security/consultation-access";
import { createInteractionToken, hashInteractionToken } from "../lib/security/consultation-token";
import { DomainError } from "../lib/consultas/service";
import { consumeRateLimit, RATE_LIMITS } from "../lib/security/rate-limit";
import type { query } from "../lib/db/postgres";
import { addFeedback, addObservation, saveQuery } from "../lib/consultas/interactions-v2";

const share="00000000-0000-4000-8000-000000000001";
const forbidden=(error:unknown)=>error instanceof DomainError && error.status===403;
test("el token público y credenciales ausentes o malformadas no llegan a la base",async()=>{
 let calls=0;const execute=(async()=>{calls++;return {rows:[]};}) as unknown as typeof query;
 for(const token of [undefined,null,"",share,"invalid","a".repeat(65)]) await assert.rejects(()=>requireConsultationInteraction(share,token,execute,true),forbidden);
 assert.equal(calls,0);
});
test("cada credencial privada tiene 256 bits y no coincide con su hash",()=>{
 const a=createInteractionToken(),b=createInteractionToken();assert.match(a,/^[a-f0-9]{64}$/);assert.notEqual(a,b);assert.notEqual(hashInteractionToken(a),a);
});
test("escribir exige el hash vinculado a la consulta y respeta su vencimiento",async()=>{
 const privateToken=createInteractionToken();let calls=0;
 const execute=(async(sql:string,values:unknown[])=>{
  calls++;assert.match(sql,/share_token=\$1 and interaction_token_hash=\$2/);assert.match(sql,/created_at >= now\(\) - interval '30 days'/);
  assert.deepEqual(values,[share,hashInteractionToken(privateToken)]);
  return {rows:[{id:"owner",cultivo:"soja",localidad_normalizada:"Tandil"}]};
 }) as unknown as typeof query;
 assert.equal((await requireConsultationInteraction(share,privateToken,execute,true)).id,"owner");assert.equal(calls,1);
 const denied=(async()=>({rows:[]})) as unknown as typeof query;
 await assert.rejects(()=>requireConsultationInteraction(share,privateToken,denied,true),forbidden);
});
test("los tres servicios de escritura rechazan un enlace sin credencial privada",async()=>{
 await assert.rejects(()=>addObservation(share,{tipo:"Otro"}),forbidden);
 await assert.rejects(()=>addFeedback(share,{coincide_campo:"si"}),forbidden);
 await assert.rejects(()=>saveQuery(share,{email:"a@example.com"}),forbidden);
});
test("las cuotas reales de lectura e interacción se separan y resisten concurrencia",async()=>{
 const counters=new Map<string,number>();
 const execute=(async(sql:string,values:unknown[]=[])=>{
  if(sql.startsWith("delete"))return {rows:[]};
  const [scope,identity,,limit]=values as [string,string,number,number];const key=scope+identity;const count=counters.get(key)??0;
  if(count>=limit)return {rows:[]};counters.set(key,count+1);return {rows:[{request_count:count+1,retry_after:60}]};
 }) as unknown as typeof query;
 for(const limit of [RATE_LIMITS.publicResultRead,RATE_LIMITS.consultationInteraction]){
  const results=await Promise.allSettled(Array.from({length:limit.limit+5},()=>consumeRateLimit(limit,"same-ip",execute)));
  assert.equal(results.filter(x=>x.status==="fulfilled").length,limit.limit);
  assert.equal(results.filter(x=>x.status==="rejected").length,5);
 }
});
