import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../form.js', import.meta.url), 'utf8');
const fields = {
  'entry.174957854':'TEST — test-lead', 'entry.1983000286':'+1 202-555-0176',
  'entry.491185921':'volnay-qa@example.com', 'entry.709092237':'test-lead-not-real',
  'entry.1380447704':'TEST profile', 'entry.21922786':'QA goals',
  'entry.686903170':'Email', 'entry.2120816330':'Not right now',
  'entry.922802930':'QA must have', 'entry.549558920':'QA feedback', website:'',
};
function harness(responses = [{status:201}]) {
  const nodes = Object.fromEntries(['f','go','err','thanks'].map(id=>[id,{hidden:false,disabled:false,textContent:'',handlers:{},addEventListener(n,fn){this.handlers[n]=fn;},setAttribute(){},focus(){this.focused=true;},reportValidity(){return true;}}]));
  nodes.thanks.hidden=true;
  const calls=[],events=[];let counter=0;
  const context={
    document:{getElementById:id=>nodes[id]},
    window:{VOLNAY_CONFIG:{supabaseUrl:'https://example.supabase.co',supabasePublishableKey:'sb_publishable_TEST'},VolnayTracking:{track:n=>events.push(n),eventCode:'northeastern-2026-11-05'}},
    FormData:class{get(name){return data[name];}},crypto:{randomUUID:()=>`id-${++counter}`},
    AbortController,setTimeout,clearTimeout,
    fetch:async(url,options)=>{
      calls.push({url,options});
      if(url.includes('google.com'))return {type:'opaque',status:0};
      const item=responses.shift()||{status:201};
      if(item instanceof Error)throw item;
      return {...item,json:async()=>({code:item.code})};
    },
  };
  const data={...fields};vm.runInNewContext(source,context);
  return {nodes,calls,events,data,context,submit:()=>nodes.f.handlers.submit({preventDefault(){}})};
}
test('confirmed database save maps every questionnaire field and mirrors Google once',async()=>{
  const h=harness();await h.submit();
  assert.equal(h.calls.length,2);assert.equal(h.calls[0].options.headers.Prefer,'return=minimal');
  const body=JSON.parse(h.calls[0].options.body);
  assert.equal(body.full_name,fields['entry.174957854']);assert.equal(body.phone,fields['entry.1983000286']);
  assert.equal(body.email,fields['entry.491185921']);assert.equal(body.instagram_handle,fields['entry.709092237']);
  assert.equal(body.linkedin_profile,fields['entry.1380447704']);assert.equal(body.real_estate_goals,fields['entry.21922786']);
  assert.equal(body.contact_preference,'Email');assert.equal(body.skool_interest,'Not right now');
  assert.equal(body.community_must_have,'QA must have');assert.equal(body.ricky_feedback,'QA feedback');
  assert.equal(body.event_code,'northeastern-2026-11-05');assert.equal(body.advertising_consent,false);assert.equal(body.analytics_consent,false);
  assert.equal(h.nodes.thanks.hidden,false);assert.equal(h.nodes.f.hidden,true);
  assert.ok(h.events.includes('form submitted'));
  assert.ok(h.events.every(event=>typeof event==='string'&&!event.includes('@')));
});
test('database rejection preserves answers, shows error, sends no Google copy or Lead',async()=>{
  const h=harness([{status:403}]);await h.submit();
  assert.equal(h.calls.length,1);assert.equal(h.nodes.thanks.hidden,true);assert.equal(h.nodes.f.hidden,false);
  assert.equal(h.nodes.err.hidden,false);assert.ok(h.events.includes('form submission failed'));assert.ok(!h.events.includes('form submitted'));
});
test('an uncertain timeout retry reuses the exact id and payload; duplicate is acknowledged',async()=>{
  const h=harness([new Error('timeout'),{status:409,code:'23505'}]);await h.submit();await h.submit();
  assert.equal(h.calls[0].options.body,h.calls[1].options.body);assert.equal(h.calls.length,2);
  assert.equal(h.nodes.thanks.hidden,false);
});
test('edited answers use a new id after a failed save',async()=>{
  const h=harness([{status:500},{status:201}]);await h.submit();h.data['entry.21922786']='Changed goals';await h.submit();
  assert.notEqual(JSON.parse(h.calls[0].options.body).id,JSON.parse(h.calls[1].options.body).id);
});
test('other 409 conflicts never count as a saved lead',async()=>{
  const h=harness([{status:409,code:'other'}]);await h.submit();assert.equal(h.nodes.thanks.hidden,true);
});
test('empty name, invalid phone and honeypot all fail before any external write',async()=>{
  for(const mutate of [d=>d['entry.174957854']=' ',d=>d['entry.1983000286']='123',d=>d.website='bot']){
    const h=harness();mutate(h.data);await h.submit();assert.equal(h.calls.length,0);
  }
});
test('a second click while saving cannot duplicate the request',async()=>{
  const h=harness();const first=h.submit();const second=h.submit();await Promise.all([first,second]);
  assert.equal(h.calls.filter(c=>c.url.includes('supabase')).length,1);
});
test('missing deployment configuration fails closed with a Google fallback link',async()=>{
  const h=harness();h.context.window.VOLNAY_CONFIG={};await h.submit();assert.equal(h.calls.length,0);assert.match(h.nodes.err.textContent,/not ready/);
});
