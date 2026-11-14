import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { updateSupplierSchema } from "@/lib/resource-validation";
import { updateSupplier } from "@/lib/resources";
type Context={params:Promise<{supplierId:string}>};
function sameOrigin(request:Request){const origin=request.headers.get("origin");if(!origin)return true;try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}}
export async function PATCH(request:Request,{params}:Context){
 if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida."},{status:403});
 const context=await getAuthenticatedContext();if(!context)return NextResponse.json({error:"Sessão não autenticada."},{status:401});
 if(!hasPermission(context.role,"resources:write"))return NextResponse.json({error:"Acesso negado."},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Corpo JSON inválido."},{status:400});}
 const parsed=updateSupplierSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:"Dados inválidos.",details:parsed.error.flatten().fieldErrors},{status:400});
 if(Object.keys(parsed.data).length===0)return NextResponse.json({error:"Indique pelo menos um campo para actualizar."},{status:400});
 const {supplierId}=await params;
 try{return NextResponse.json({data:await updateSupplier(context.companyId,context.userId,supplierId,parsed.data)});}
 catch(error){if(error instanceof Error&&error.message==="SUPPLIER_NOT_FOUND")return NextResponse.json({error:"Fornecedor não encontrado nesta empresa."},{status:404});console.error("Supplier update failed",error);return NextResponse.json({error:"Não foi possível actualizar o fornecedor."},{status:500});}
}