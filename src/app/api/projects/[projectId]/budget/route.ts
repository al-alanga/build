import { NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedContext } from "@/lib/auth";
import { hasPermission } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { calculateBudgetPricing } from "@/lib/budget-calculator";

type RouteContext = { params: Promise<{ projectId: string }> };
const revisionSchema = z.object({
  indirectCost: z.number().finite().min(0),
  overheadRate: z.number().finite().min(0).max(1),
  profitRate: z.number().finite().min(0).max(1),
  taxRate: z.number().finite().min(0).max(1),
  notes: z.string().trim().max(2000).optional(),
});
function sameOrigin(request: Request) {
  const origin=request.headers.get("origin");
  if(!origin)return true;
  try{return new URL(origin).host===new URL(request.url).host;}catch{return false;}
}
export async function GET(_request: Request,{params}:RouteContext){
  const context=await getAuthenticatedContext();
  if(!context)return NextResponse.json({error:"Sessão não autenticada."},{status:401});
  if(!hasPermission(context.role,"budget:read"))return NextResponse.json({error:"Acesso negado."},{status:403});
  const {projectId}=await params;
  const project=await prisma.project.findFirst({where:{id:projectId,companyId:context.companyId},select:{id:true,currency:true,name:true}});
  if(!project)return NextResponse.json({error:"Obra não encontrada."},{status:404});
  const [items,revisions]=await Promise.all([
    prisma.workItem.findMany({where:{projectId},orderBy:[{sortOrder:"asc"},{code:"asc"}],include:{children:{select:{id:true}},compositions:{orderBy:{version:"desc"},take:1,include:{lines:{select:{coefficient:true,unitPriceAtSave:true,resource:{select:{code:true,name:true,type:true,unit:true}}}}}}}}),
    prisma.budgetRevision.findMany({where:{projectId},orderBy:{revisionNumber:"desc"}}),
  ]);
  const leaves=items.filter(item=>item.children.length===0);
  const rows=leaves.map(item=>{
    const composition=item.compositions[0];
    const unitCost=composition?.lines.reduce((sum,line)=>sum+Number(line.coefficient)*Number(line.unitPriceAtSave),0)??0;
    const quantity=Number(item.quantity);
    return {id:item.id,code:item.code,name:item.name,unit:item.unit,quantity,compositionVersion:composition?.version??null,unitCost,directTotal:quantity*unitCost,lines:composition?.lines.map(line=>({code:line.resource.code,name:line.resource.name,type:line.resource.type,unit:line.resource.unit,coefficient:Number(line.coefficient),unitPrice:Number(line.unitPriceAtSave),total:Number(line.coefficient)*Number(line.unitPriceAtSave)}))??[]};
  });
  return NextResponse.json({data:{project,items:rows,directCost:rows.reduce((sum,row)=>sum+row.directTotal,0),missingCompositionCount:rows.filter(row=>row.compositionVersion===null).length,revisions}});
}
export async function POST(request:Request,{params}:RouteContext){
  if(!sameOrigin(request))return NextResponse.json({error:"Origem não permitida."},{status:403});
  const context=await getAuthenticatedContext();
  if(!context)return NextResponse.json({error:"Sessão não autenticada."},{status:401});
  if(!hasPermission(context.role,"budget:write"))return NextResponse.json({error:"Acesso negado."},{status:403});
  let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Corpo JSON inválido."},{status:400});}
  const parsed=revisionSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:"Parâmetros financeiros inválidos.",details:parsed.error.flatten().fieldErrors},{status:400});
  const {projectId}=await params;
  try{
    const result=await prisma.$transaction(async tx=>{
      const project=await tx.project.findFirst({where:{id:projectId,companyId:context.companyId},select:{id:true}});
      if(!project)throw new Error("PROJECT_NOT_FOUND");
      const items=await tx.workItem.findMany({where:{projectId},include:{children:{select:{id:true}},compositions:{orderBy:{version:"desc"},take:1,include:{lines:{select:{coefficient:true,unitPriceAtSave:true,resource:{select:{code:true,name:true}}}}}}}});
      const leaves=items.filter(item=>item.children.length===0);
      if(leaves.length===0)throw new Error("NO_BUDGET_ITEMS");
      const missing=leaves.filter(item=>!item.compositions[0]||item.compositions[0].lines.length===0);
      if(missing.length>0)throw new Error("MISSING_COMPOSITIONS:"+missing.map(item=>item.code).join(", "));
      const directCost=leaves.reduce((sum,item)=>{
        const unitCost=item.compositions[0].lines.reduce((n,line)=>n+Number(line.coefficient)*Number(line.unitPriceAtSave),0);
        return sum+Number(item.quantity)*unitCost;
      },0);
      const pricing=calculateBudgetPricing({directCost,indirectCost:parsed.data.indirectCost,overheadRate:parsed.data.overheadRate,profitRate:parsed.data.profitRate,taxRate:parsed.data.taxRate});
      const latest=await tx.budgetRevision.aggregate({where:{projectId},_max:{revisionNumber:true}});
      const assumptions={
        notes:parsed.data.notes??"",
        leafItemsOnly:true,
        formula:"directCost=sum(quantity × composition unit cost for leaf items)",
        generatedAt:new Date().toISOString(),
        pricing,
        itemSnapshot:leaves.map(item=>{
          const composition=item.compositions[0];
          const lines=composition.lines.map(line=>({
            resourceCode:line.resource.code,resourceName:line.resource.name,coefficient:Number(line.coefficient),
            unitPrice:Number(line.unitPriceAtSave),lineTotal:Number(line.coefficient)*Number(line.unitPriceAtSave),
          }));
          const unitCost=lines.reduce((sum,line)=>sum+line.lineTotal,0);
          return {code:item.code,name:item.name,unit:item.unit,quantity:Number(item.quantity),compositionVersion:composition.version,unitCost,directTotal:Number(item.quantity)*unitCost,lines};
        }),
      };
      const revision=await tx.budgetRevision.create({data:{projectId,revisionNumber:(latest._max.revisionNumber??0)+1,status:"DRAFT",directCost,indirectCost:parsed.data.indirectCost,overheadRate:parsed.data.overheadRate,profitRate:parsed.data.profitRate,taxRate:parsed.data.taxRate,sellingPrice:pricing.sellingPrice,assumptions}});
      await tx.auditLog.create({data:{companyId:context.companyId,userId:context.userId,action:"BUDGET_REVISION_CREATED",entityType:"BudgetRevision",entityId:revision.id,afterData:{projectId,revisionNumber:revision.revisionNumber,directCost:directCost.toFixed(2),sellingPrice:pricing.sellingPrice.toFixed(2),leafItemCount:leaves.length,assumptions} }});
      return {revision,pricing,leafItemCount:leaves.length};
    });
    return NextResponse.json({data:result},{status:201});
  }catch(error){
    if(error instanceof Error&&error.message==="PROJECT_NOT_FOUND")return NextResponse.json({error:"Obra não encontrada."},{status:404});
    if(error instanceof Error&&error.message==="NO_BUDGET_ITEMS")return NextResponse.json({error:"Adicione serviços à EAP antes de gerar o orçamento."},{status:422});
    if(error instanceof Error&&error.message.startsWith("MISSING_COMPOSITIONS:"))return NextResponse.json({error:"Existem serviços sem composição de custos. Complete-os antes de guardar a revisão.",items:error.message.slice("MISSING_COMPOSITIONS:".length).trim().split(", ")},{status:422});
    console.error("Budget revision creation failed",error);
    return NextResponse.json({error:"Não foi possível gerar a revisão do orçamento."},{status:500});
  }
}
