import { z } from 'zod';
const decision=z.enum(['accept','decline','cancel']);
export function approvalResponse(method,input,params={}){
 if(method==='item/commandExecution/requestApproval'||method==='item/fileChange/requestApproval')return z.object({decision}).strict().parse(typeof input==='string'?{decision:input}:input);
 if(method==='item/permissions/requestApproval'){
  const v=z.object({permissions:z.object({network:z.object({enabled:z.boolean()}).strict().optional(),fileSystem:z.object({read:z.array(z.string()).nullable().default(null),write:z.array(z.string()).nullable().default(null)}).strict().optional()}).strict(),scope:z.enum(['turn','session'])}).strict().parse(input);
  const requested=params.permissions||{};
  if(v.permissions.network?.enabled&&!requested.network?.enabled)throw new Error('Cannot grant unrequested network permission');
  for(const kind of ['read','write'])if(v.permissions.fileSystem?.[kind]?.some(p=>!requested.fileSystem?.[kind]?.includes(p)))throw new Error('Cannot grant unrequested filesystem permission');return v;
 }
 if(method==='item/tool/requestUserInput'){
  const v=z.object({answers:z.record(z.object({answers:z.array(z.string())}).strict())}).strict().parse(input);
  if(Object.keys(v.answers).some(k=>!params.questions?.some(q=>q.id===k)))throw new Error('Unknown input question');return v;
 }
 if(method==='mcpServer/elicitation/request')return z.object({action:z.enum(['accept','decline','cancel']),content:z.unknown().nullable(),_meta:z.unknown().nullable().default(null)}).strict().parse(input);
 throw new Error(`Unsupported request method: ${method}; cannot approve`);
}
export const supportedApproval=m=>['item/commandExecution/requestApproval','item/fileChange/requestApproval','item/permissions/requestApproval','item/tool/requestUserInput','mcpServer/elicitation/request'].includes(m);
