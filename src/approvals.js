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
  const v=z.object({answers:z.record(z.string(),z.object({answers:z.array(z.string())}).strict())}).strict().parse(input);
  if(Object.keys(v.answers).some(k=>!params.questions?.some(q=>q.id===k)))throw new Error('Unknown input question');return v;
 }
 if(method==='mcpServer/elicitation/request'){
  const result=z.object({action:z.enum(['accept','decline','cancel']),content:z.unknown().nullable(),_meta:z.unknown().nullable().default(null)}).strict().parse(input);
  if(result.action==='accept')validateElicitation(params.requestedSchema,result.content);
  return result;
 }
 throw new Error(`Unsupported request method: ${method}; cannot approve`);
}
export const supportedApproval=m=>['item/commandExecution/requestApproval','item/fileChange/requestApproval','item/permissions/requestApproval','item/tool/requestUserInput','mcpServer/elicitation/request'].includes(m);
export function validateElicitation(schema,content){
 const fail=()=>{throw new Error('Unsupported or invalid elicitation form; acceptance blocked');};
 if(!schema||schema.type!=='object'||!schema.properties||!content||Array.isArray(content)||typeof content!=='object'||Object.keys(schema).some(k=>!['type','properties','required','title','description','additionalProperties'].includes(k)))fail();
 if(schema.additionalProperties!==undefined&&schema.additionalProperties!==false)fail();
 if(schema.required!==undefined&&(!Array.isArray(schema.required)||schema.required.some(k=>typeof k!=='string'||!Object.hasOwn(schema.properties,k))))fail();
 if(Object.keys(content).some(k=>!Object.hasOwn(schema.properties,k)))fail();
 for(const [key,field]of Object.entries(schema.properties)){
  if(!field||!['string','boolean','number','integer'].includes(field.type)||Object.keys(field).some(k=>!['type','title','description','enum','minimum','maximum','minLength','maxLength','default'].includes(k)))fail();
  if(field.enum!==undefined&&!Array.isArray(field.enum))fail();
  for(const k of ['minimum','maximum','minLength','maxLength'])if(field[k]!==undefined&&(typeof field[k]!=='number'||!Number.isFinite(field[k])))fail();
  const value=content[key];if(value===undefined){if(schema.required?.includes(key))fail();continue;}
  if(field.type==='integer'?!Number.isSafeInteger(value):typeof value!==field.type)fail();
  if(typeof value==='number'&&(!Number.isFinite(value)||field.minimum!==undefined&&value<field.minimum||field.maximum!==undefined&&value>field.maximum))fail();
  if(typeof value==='string'&&(field.minLength!==undefined&&value.length<field.minLength||field.maxLength!==undefined&&value.length>field.maxLength))fail();
  if(field.enum&&!field.enum.includes(value))fail();
 }
 return content;
}
