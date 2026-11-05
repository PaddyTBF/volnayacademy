// Explicit, synthetic-only integration test. Never runs as part of npm test.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
if (!process.argv.includes('--write-qa')) throw new Error('Requires --write-qa approval; creates one permanent synthetic database row, no Google submission.');
const env=Object.fromEntries((await readFile('.env.local','utf8')).trim().split('\n').map(line=>{const i=line.indexOf('=');return [line.slice(0,i),line.slice(i+1)];}));
const url=env.PUBLIC_SUPABASE_URL;
if(url!=='https://jhqtirahcczngpioryhj.supabase.co') throw new Error('Unexpected target; review project identity first.');
const headers={apikey:env.PUBLIC_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json',Prefer:'return=minimal'};
const payload={
  id:'196ac112-9edc-42db-b388-25058bc1653f',
  full_name:'TEST — Volnay website QA 2026-11-05 — test-lead',phone:'+1 202-555-0176',email:'volnay-qa@example.com',
  instagram_handle:'test-lead-not-real',linkedin_profile:'TEST — no real profile',
  real_estate_goals:'[test-lead] Synthetic QA: verify the landing page saves every labeled field. Not a prospect.',
  contact_preference:'Email',skool_interest:'Not right now',
  community_must_have:'[test-lead] QA only. Do not contact or include in lead totals.',
  ricky_feedback:'[test-lead] Database field verification; not an additional Google Form submission.',
  event_code:'unattributed',page_path:'/volnayacademy/',analytics_consent:false,advertising_consent:false,consent_version:'1',
};
const endpoint=url+'/rest/v1/form_submissions';
const first=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(payload)});
const result={project:'jhqtirahcczngpioryhj',qa_id:payload.id,initial_insert_status:first.status,checks:[]};
result.checks.push({name:'acknowledged_insert',pass:first.status===201});
const duplicate=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify(payload)});
const duplicateBody=await duplicate.json();
result.checks.push({name:'duplicate_rejected_without_second_row',pass:duplicate.status===409&&duplicateBody.code==='23505',status:duplicate.status});
const read=await fetch(endpoint+'?id=eq.'+payload.id,{headers:{apikey:headers.apikey}});
result.checks.push({name:'anonymous_read_denied',pass:read.status===401||read.status===403,status:read.status});
const bad=await fetch(endpoint,{method:'POST',headers,body:JSON.stringify({...payload,id:crypto.randomUUID(),created_at:'2000-01-01T00:00:00Z'})});
result.checks.push({name:'server_timestamp_not_client_writable',pass:bad.status===401||bad.status===403,status:bad.status});
await mkdir('output/verification',{recursive:true});
await writeFile('output/verification/storage.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
if(result.checks.some(x=>!x.pass))process.exitCode=1;
