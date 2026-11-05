(function () {
  'use strict';
  const config = window.VOLNAY_CONFIG || {};
  const EVENTS = new Set(['landing viewed','form started','form submission attempted','form submitted','form submission failed','google form request completed','google form request failed']);
  const validEventCode = new URLSearchParams(location.search).get('event') === 'northeastern-2026-11-05' ? 'northeastern-2026-11-05' : null;
  // Store only a fixed event code, never arbitrary URLs, UTMs, email addresses or answer text.
  let eventCode = validEventCode || 'unattributed';
  try {
    if (validEventCode) sessionStorage.setItem('volnay_event_v1', validEventCode);
    else if (sessionStorage.getItem('volnay_event_v1') === 'northeastern-2026-11-05') eventCode = 'northeastern-2026-11-05';
  } catch {}
  const production = (config.allowedHosts || []).includes(location.hostname);
  // Clean unknown query parameters before either vendor can inspect the current URL.
  if (production && (location.search || location.hash)) {
    history.replaceState(null, '', location.pathname + (validEventCode ? '?event=' + validEventCode : ''));
  }
  // Default-on tracking, subject to browser privacy signals. No consent is collected.
  const gpc = navigator.globalPrivacyControl === true;
  const dnt = navigator.doNotTrack === '1';
  const enabled = Object.freeze({analytics:!dnt, advertising:!gpc&&!dnt});
  let phReady = false;
  let phLoading = false;
  let metaReady = false;
  let metaLoading = false;
  let pageTracked = false;
  let metaPageTracked = false;
  const queue = [];

  function safeProperties(event) {
    if (!event || !event.properties) return event;
    // The SDK itself masks replay contents; stripping snapshots would break replay.
    if (event.event === '$snapshot') return event;
    const properties = event.properties;
    const cleanUrl = value => {
      try { const url = new URL(value); return url.origin + url.pathname; } catch { return ''; }
    };
    for (const key of Object.keys(properties)) {
      if (/url|referr|pathname|initial_path/i.test(key) && typeof properties[key] === 'string') {
        if (/pathname|initial_path/i.test(key)) properties[key] = '/volnayacademy/';
        else properties[key] = /referr/i.test(key) ? (() => { try { return new URL(properties[key]).origin; } catch { return ''; } })() : cleanUrl(properties[key]);
      }
      if (/^(email|phone|name|full_name|goals|answers|\$set|\$set_once)$/i.test(key)) delete properties[key];
    }
    return event;
  }

  function loadPosthog() {
    if (!production || !enabled.analytics || phReady || phLoading || !config.posthogToken || !config.posthogHost) return;
    phLoading = true;
    // PostHog's canonical HTML loader. Loads automatically on the production host.
    (function (t,e) {
      if (e.__SV) return;
      window.posthog=e;e._i=[];
      e.init=function(token,options,name) {
        function stub(target,method) {
          const bits=method.split('.'); if(bits.length===2){target=target[bits[0]];method=bits[1];}
          target[method]=function(){target.push([method].concat(Array.prototype.slice.call(arguments)));};
        }
        const script=t.createElement('script');script.type='text/javascript';script.crossOrigin='anonymous';script.async=true;
        script.src=options.api_host.replace('.i.posthog.com','-assets.i.posthog.com')+'/static/array.js';
        script.onerror=function(){phLoading=false;};
        t.head.appendChild(script);
        const instance=name ? (e[name]=[]) : e; name=name||'posthog';
        instance.people=instance.people||[];
        instance.toString=function(){return name;}; instance.people.toString=function(){return name+'.people';};
        'capture identify reset register register_once unregister opt_in_capturing opt_out_capturing set_config startSessionRecording stopSessionRecording'.split(' ').forEach(method=>stub(instance,method));
        e._i.push([token,options,name]);
      };e.__SV=1;
    })(document,window.posthog||[]);
    window.posthog.init(config.posthogToken, {
      api_host:config.posthogHost, defaults:'2026-08-30',
      autocapture:true, capture_pageview:true, capture_pageleave:true,
      capture_performance:true, capture_exceptions:true,
      person_profiles:'identified_only', disable_session_recording:false,
      // Never record form values, questionnaire text, response payloads, or console output.
      session_recording:{maskAllInputs:true,maskTextSelector:'[data-private]',recordHeaders:false,recordBody:false},
      enable_recording_console_log:false,
      opt_out_capturing_by_default:false, cross_subdomain_cookie:false,
      before_send:safeProperties,
      loaded:function(client) {
        phLoading=false;phReady=true;
        if (!enabled.analytics) { client.opt_out_capturing({clear_persistence:true});queue.length=0;return; }
        client.opt_in_capturing({captureEventName:false});
        client.register({site:'volnay-academy',event_code:eventCode,schema_version:'1'});
        if (!pageTracked) {pageTracked=true;client.capture('landing viewed');}
        queue.splice(0).forEach(name=>client.capture(name));
      },
    });
  }

  function loadMeta() {
    if (!production || !enabled.advertising || metaReady || metaLoading || !config.metaPixelId) return;
    metaLoading=true;
    if (!window.fbq) {
      const fbq=function(){fbq.callMethod ? fbq.callMethod.apply(fbq,arguments) : fbq.queue.push(arguments);};
      window.fbq=fbq;window._fbq=fbq;fbq.push=fbq;fbq.loaded=true;fbq.version='2.0';fbq.queue=[];
    }
    const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';
    script.onload=function(){
      metaLoading=false;
      if (!enabled.advertising) return;
      metaReady=true;
      window.fbq('consent','grant');
      window.fbq('set','autoConfig',false,config.metaPixelId);
      window.fbq('init',config.metaPixelId);
      if (!metaPageTracked) {metaPageTracked=true;window.fbq('track','PageView',{event_code:eventCode});}
    };
    script.onerror=function(){metaLoading=false;};
    document.head.appendChild(script);
  }

  function track(name) {
    if (!EVENTS.has(name)) return;
    if(enabled.analytics && production){
      if(phReady) window.posthog.capture(name,{event_code:eventCode},{transport:'sendBeacon',send_instantly:true});
      else if(queue.length<20) queue.push(name);
    }
    if(enabled.advertising && metaReady && name==='form submitted') window.fbq('track','Lead',{event_code:eventCode});
    if(enabled.advertising && metaReady && name==='form started') window.fbq('trackCustom','FormStarted',{event_code:eventCode});
  }
  window.VolnayTracking=Object.freeze({track,getTrackingState:()=>({...enabled}),eventCode});
  loadPosthog();
  loadMeta();
})();
