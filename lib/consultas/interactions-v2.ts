import { hasDatabaseConfig, query } from "@/lib/db/postgres";
import { DomainError } from "./service";

async function resolve(id: string) {
  if (!hasDatabaseConfig()) throw new DomainError("PERSISTENCIA_NO_DISPONIBLE", "La persistencia no está configurada.", 503);
  const result=await query<{id:string;cultivo:string;localidad_normalizada:string}>("select id::text,cultivo,localidad_normalizada from consultas where share_token=$1",[id]);
  if(!result.rows[0]) throw new DomainError("CONSULTA_NO_ENCONTRADA","No encontramos esa consulta.",404); return result.rows[0];
}
export async function addObservation(id:string,body:{tipo:string;descripcion?:string}) { const c=await resolve(id); if(!body.tipo) throw new DomainError("REQUEST_INVALIDO","Falta el tipo de observación."); return query<{id:string}>("insert into observaciones(consulta_id,opciones,detalle,origen) values($1,$2,$3,'api_public') returning id::text",[c.id,[body.tipo],body.descripcion??null]); }
export async function addFeedback(id:string,body:{coincide_campo:"si"|"no"|"parcialmente";sugerencia?:string;canal?:string}) { const c=await resolve(id); return query<{id:string}>("insert into feedback(consulta_id,utilidad,observaciones,sugerencia,origen) values($1,$2,'{}',$3,$4) returning id::text",[c.id,body.coincide_campo,body.sugerencia??null,body.canal??'web']); }
export async function saveQuery(id:string,body:{email:string}) { const c=await resolve(id); if(!body.email?.includes('@')) throw new DomainError("REQUEST_INVALIDO","El email no es válido."); return query<{id:string}>("insert into interesados(consulta_id,email,localidad,cultivo,origen) values($1,$2,$3,$4,'api_public') returning id::text",[c.id,body.email.trim().toLowerCase(),c.localidad_normalizada,c.cultivo]); }
