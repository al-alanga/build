import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { updateResourceSchema } from "@/lib/resource-validation";
import { updateResource } from "@/lib/resources";
type Context={params:Promise<{resourceId:string}>};
function sameOrigin(request:Request){const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}}
export async function PATCH(request:Request,{params}:Context){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida."},{status:403});
 const context=await getAuthenticatedContext();if(!context)return NextResponse.json({error:"Sessão não autenticada."},{status:401});
 if(!hasPermission(context.role,"resources:write"))return NextResponse.json({error:"Acesso negado."},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Corpo JSON inválido."},{status:400});}
 const parsed=updateResourceSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Dados inválidos.",details:parsed.error.flatten().fieldErrors},{status:400});
 const {resourceId}=await params;
 try{return NextResponse.json({data:await updateResource(context.companyId,context.userId,resourceId,parsed.data)});}
 catch(error){if(error instanceof Error&&error.message==="RESOURCE_NOT_FOUND")return NextResponse.json({error:"Recurso não encontrado nesta empresa."},{status:404});if(error instanceof Error&&error.message==="SUPPLIER_NOT_FOUND")return NextResponse.json({error:"O fornecedor seleccionado não pertence à sua empresa."},{status:400});if(error&&typeof error==="object"&&"code"in error&&error.code==="P2002")return NextResponse.json({error:"Já existe um recurso com este código na empresa."},{status:409});console.error("Resource update failed",error);return NextResponse.json({error:"Não foi possível actualizar o recurso."},{status:500});}
}