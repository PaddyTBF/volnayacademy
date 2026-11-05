import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';
const source=await readFile(new URL('../tracking.js',import.meta.url),'utf8');
function harness({saved=null,gpc=false,dnt=false,host='paddytbf.github.io',query='',hash=''}={}) {
  const nodes=new Map(),scripts=[],storage=new Map(),session=new Map(),urls=[];
  if(saved)storage.set('volnay_tracking_consent_v1',JSON.stringify({...saved,version:1,at:Date.now()}));
  function node(id){if(!nodes.has(id))nodes.set(id,{hidden:true,checked:false,disabled:false,textContent:'',handlers:{},addEventListener(n,f){this.handlers[n]=f;},focus(){}});return nodes.get(id);}
  const context={
    window:{VOLNAY_CONFIG:{allowedHosts:['paddytbf.github.io'],posthogHost:'https://us.i.posthog.com',posthogToken:'phc_TEST',metaPixelId:'4490650331206832'}},
    document:{getElementById:node,createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
    sessionStorage:{getItem:k=>session.get(k)||null,setItem:(k,v)=>session.set(k,v)},
    navigator:{globalPrivacyControl:gpc,doNotTrack:dnt?'1':'0'},
    location:{hostname:host,pathname:'/volnayacademy/',search:query,hash},
    history:{replaceState:(_a,_b,url)=>urls.push(url)},URL,URLSearchParams,Date,Set,
  };
  vm.runInNewContext(source,context);
  return {context,nodes,scripts,storage,urls,node,click:id=>node(id).handlers.click()};
}
test('production starts both providers automatically without permission controls',()=>{
  const h=harness();assert.equal(h.scripts.length,2);assert.equal(h.nodes.size,0);
  assert.equal(h.context.window.VolnayTracking.getTrackingState().analytics,true);
  assert.equal(h.context.window.VolnayTracking.getTrackingState().advertising,true);
});
test('automatic analytics retains standard capture and masked replay',()=>{
  const h=harness();const config=h.context.window.posthog._i[0][1];
  assert.equal(config.autocapture,true);assert.equal(config.capture_pageview,true);assert.equal(config.capture_pageleave,true);
  assert.equal(config.opt_out_capturing_by_default,false);
  assert.equal(config.disable_session_recording,false);assert.equal(config.session_recording.maskAllInputs,true);
  assert.equal(config.session_recording.recordBody,false);assert.equal(config.session_recording.recordHeaders,false);
  assert.equal(config.session_recording.maskTextSelector,'[data-private]');assert.equal(config.enable_recording_console_log,false);
});
test('obsolete permission UI preferences no longer gate provider startup',()=>{
  const h=harness({saved:{analytics:false,advertising:false}});assert.equal(h.scripts.length,2);
});
test('Meta Lead fires only for a database-confirmed form submitted event',()=>{
  const h=harness();h.scripts.find(s=>s.src.includes('facebook')).onload();
  const fbq=h.context.window.fbq;fbq.queue.length=0;
  h.context.window.VolnayTracking.track('form submission attempted');assert.equal(fbq.queue.length,0);
  h.context.window.VolnayTracking.track('form submitted');assert.equal(fbq.queue.length,1);assert.equal(fbq.queue[0][1],'Lead');
});
test('GPC blocks Meta; DNT blocks both without any UI action',()=>{
  const g=harness({gpc:true});assert.equal(g.scripts.length,1);assert.match(g.scripts[0].src,/posthog/);assert.equal(g.context.window.VolnayTracking.getTrackingState().advertising,false);
  const d=harness({dnt:true});assert.equal(d.scripts.length,0);
});
test('manual form events queue until PostHog loads and flush once',()=>{
  const h=harness();h.context.window.VolnayTracking.track('form started');
  const client={events:[],capture(n){this.events.push(n);},opt_in_capturing(){},register(){}};
  h.context.window.posthog._i[0][1].loaded(client);h.context.window.posthog=client;
  assert.deepEqual(client.events,['landing viewed','form started']);
});
test('local preview never sends analytics or Meta events',()=>{
  const h=harness({host:'127.0.0.1'});assert.equal(h.scripts.length,0);
});
test('only exact event marker survives URL sanitization; unknown values never become attribution',()=>{
  const h=harness({query:'?event=northeastern-2026-11-05&email=someone%40example.com',hash:'#private'});
  assert.equal(h.context.window.VolnayTracking.eventCode,'northeastern-2026-11-05');assert.equal(h.urls[0],'/volnayacademy/?event=northeastern-2026-11-05');
  const unknown=harness({query:'?event=someone%40example.com'});assert.equal(unknown.context.window.VolnayTracking.eventCode,'unattributed');assert.equal(unknown.urls[0],'/volnayacademy/');
});
test('PostHog URL properties strip arbitrary query strings and form fields',()=>{
  const h=harness();const before=h.context.window.posthog._i[0][1].before_send;
  const event=before({event:'form submitted',properties:{$current_url:'https://paddytbf.github.io/volnayacademy/?email=PRIVATE#PRIVATE',$referrer:'https://example.com/?phone=PRIVATE',email:'PRIVATE',$set:{email:'PRIVATE'}}});
  assert.ok(!JSON.stringify(event).includes('PRIVATE'));
});
test('arbitrary custom event names and questionnaire values are never emitted',()=>{
  const h=harness();const client={events:[],capture(n){this.events.push(n);},opt_in_capturing(){},register(){}};
  h.context.window.posthog._i[0][1].loaded(client);h.context.window.posthog=client;
  h.context.window.VolnayTracking.track('private answer@example.com');assert.deepEqual(client.events,['landing viewed']);
});

test('published markup has no permission prompt and preserves form privacy boundaries',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.doesNotMatch(html,/tracking-consent|consent-accept|privacy-settings|Tracking settings/);
  assert.match(html,/<form[^>]+class="ph-no-capture"[^>]+data-private/);
  assert.match(html,/href="privacy.html"/);
});
