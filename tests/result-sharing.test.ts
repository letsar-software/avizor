import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { sharedResultPath, resultShareLinks } from "../lib/results/sharing";
import { getPublicResult } from "../lib/consultas/public-result";
import { DomainError } from "../lib/consultas/service";
import type { query } from "../lib/db/postgres";
import type { ResultadoConsultaV2Publica } from "../types";
import { PestSummaryCard } from "../components/results/PestResults";

const token="00000000-0000-4000-8000-000000000001";
const snapshot={id:null,share_token:token,request_id:token,estado_general:"Sin alertas activas",explicacion:"Condiciones de la consulta original.",localidad:{nombre:"Tandil",provincia:"Buenos Aires",pais:"Argentina",latitud:-37,longitud:-59},cultivo:"soja",fecha_ref:"2026-10-10",generado_en:"2026-10-10T12:00:00Z",proveedor_climatico:"Open-Meteo",reglas:[],contexto_fenologico:{disponible:false,modifica_reglas:false},duracion_ms:1,clima:{serie:[],rango_temporal:{desde:"2026-09-27",hasta:"2026-10-10"},cobertura:1,variables_disponibles:[],adapter_version:"3.1"}} as ResultadoConsultaV2Publica;
const mockQuery=(rows:unknown[])=> (async()=>({rows})) as unknown as typeof query;
const isError=(code:string,status:number)=>(error:unknown)=>error instanceof DomainError && error.code===code && error.status===status;

test("WhatsApp y correo incluyen la URL canónica y los mensajes exactos",()=>{
  const links=resultShareLinks("https://avizor.example/resultado?otro=1",token);
  const url=`https://avizor.example${sharedResultPath(token)}`;
  assert.equal(links.resultUrl,url);
  assert.equal(new URL(links.whatsapp).searchParams.get("text"),`Te comparto este resultado de Avizor 🌱\nPodés consultarlo acá: ${url}`);
  const email=new URL(links.email);
  assert.equal(email.protocol,"mailto:");assert.equal(email.pathname,"");
  assert.equal(email.searchParams.get("subject"),"Resultado de Avizor");
  assert.equal(email.searchParams.get("body"),`Te comparto un resultado generado en Avizor.\n\nPodés consultarlo acá: ${url}\n\nAvizor · La señal antes del problema.`);
});
test("cada consulta genera su propio enlace y se rechazan tokens y orígenes inválidos",()=>{
  assert.notEqual(resultShareLinks("http://localhost:3000",token).resultUrl,resultShareLinks("http://localhost:3000","00000000-0000-4000-8000-000000000002").resultUrl);
  assert.throws(()=>sharedResultPath("../../admin"));assert.throws(()=>resultShareLinks("javascript:alert(1)",token));
});
test("recupera exclusivamente por token y devuelve el snapshot con su ID persistido",async()=>{
  const calls:{sql:string;values:unknown[]}[]=[];
  const execute=(async(sql:string,values:unknown[])=>{calls.push({sql,values});return {rows:[{id:"persistido",resultado:snapshot,vigente:true}]};}) as unknown as typeof query;
  const result=await getPublicResult(token,execute,true);
  assert.equal(result.id,"persistido");assert.equal(result.share_token,token);assert.equal(result.generado_en,snapshot.generado_en);assert.deepEqual(result.reglas,snapshot.reglas);
  assert.deepEqual(calls[0].values,[token]);assert.match(calls[0].sql,/where share_token=\$1/);
});
test("consulta inexistente y no persistida no producen un resultado compartible",async()=>{
  await assert.rejects(()=>getPublicResult(token,mockQuery([]),true),isError("CONSULTA_NO_ENCONTRADA",404));
  await assert.rejects(()=>getPublicResult(token,mockQuery([]),false),isError("CONSULTA_NO_ENCONTRADA",404));
});
test("el vencimiento se respeta antes de devolver el snapshot",async()=>{
  await assert.rejects(()=>getPublicResult(token,mockQuery([{id:"x",resultado:snapshot,vigente:false}]),true),isError("ENLACE_VENCIDO",410));
});
test("token inválido se rechaza antes de consultar la base",async()=>{
  let called=false;const execute=(async()=>{called=true;return {rows:[]};}) as unknown as typeof query;
  await assert.rejects(()=>getPublicResult("invalido",execute,true),isError("CONSULTA_NO_ENCONTRADA",404));assert.equal(called,false);
});
test("no sustituye errores de base ni snapshots incompatibles por otra consulta",async()=>{
  const execute=(async()=>{throw new Error("offline");}) as unknown as typeof query;
  await assert.rejects(()=>getPublicResult(token,execute,true),/offline/);
  await assert.rejects(()=>getPublicResult(token,mockQuery([{id:"x",resultado:{categorias:[]},vigente:true}]),true),isError("CONSULTA_NO_ENCONTRADA",404));
});
test("la tarjeta de plagas conserva el token en su enlace de detalle",()=>{
  const basePath=sharedResultPath(token);
  const card=renderToStaticMarkup(React.createElement(PestSummaryCard,{result:snapshot,basePath}));
  assert.ok(card.includes(`${basePath}/plagas`));
});
