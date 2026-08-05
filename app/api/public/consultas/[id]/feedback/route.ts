import { addFeedback } from "@/lib/consultas/interactions-v2"; import { failure,requestId,success } from "@/lib/http/responses";
export async function POST(request:Request,{params}:{params:{id:string}}){const rid=requestId(request);try{const result=await addFeedback(params.id,await request.json());return success({id:result.rows[0]?.id},rid,{},201);}catch(error){return failure(error,rid);}}
