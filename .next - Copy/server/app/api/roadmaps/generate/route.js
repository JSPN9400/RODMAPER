(()=>{var a={};a.id=593,a.ids=[593],a.modules={261:a=>{"use strict";a.exports=require("next/dist/shared/lib/router/utils/app-paths")},3295:a=>{"use strict";a.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11107:(a,b,c)=>{"use strict";c.r(b),c.d(b,{handler:()=>J,patchFetch:()=>I,routeModule:()=>E,serverHooks:()=>H,workAsyncStorage:()=>F,workUnitAsyncStorage:()=>G});var d={};c.r(d),c.d(d,{POST:()=>D});var e=c(95736),f=c(9117),g=c(4044),h=c(39326),i=c(32324),j=c(261),k=c(54290),l=c(85328),m=c(38928),n=c(46595),o=c(3421),p=c(17679),q=c(41681),r=c(63446),s=c(86439),t=c(51356),u=c(52963),v=c(66147),w=c(84941),x=c(70373);async function y(a,b,c){let d=`${b}:${a.trim().toLowerCase().replace(/\s+/g," ")}`;await x.z.goalAnalytics.upsert({where:{goalKey:d},create:{goalKey:d,goal:a,type:b,durationDays:c,popularityCount:1},update:{popularityCount:{increment:1},durationDays:c}})}var z=c(48253);async function A(a,b,c=8e3){let d=function(){let a=process.env.GROQ_API_KEY;if(!a)throw Error("GROQ_API_KEY is not configured");return new z.Ay({apiKey:a})}(),e=await d.chat.completions.create({model:"llama-3.3-70b-versatile",temperature:.4,max_tokens:c,messages:[{role:"system",content:a},{role:"user",content:b}]}),f=(e.choices[0]?.message?.content||"").replace(/```json|```/g,"").trim(),g=-1!==f.indexOf("{")?f.indexOf("{"):f.indexOf("["),h=Math.max(f.lastIndexOf("}"),f.lastIndexOf("]"));return JSON.parse(g>=0&&h>=0?f.slice(g,h+1):f)}async function B(a){return A(`You are an expert learning coach. Create a practical day-by-day roadmap.
CRITICAL: Every day must have HANDS-ON practice, not just reading.
Difficulty must increase gradually with this distribution: easy 30%, medium 50%, hard 20%.
Use this daily split: Morning theory 30%, Afternoon practice problems 50%, Evening mini project or review 20%.
Return ONLY valid JSON. Use real free URLs only.`,`Create a short-term roadmap for:
Goal: ${a.goal}
Current level: ${a.currentLevel}
Days available: ${a.daysAvailable}
Hours per day: ${a.hoursPerDay}
Background: ${a.background}
Focus type: ${a.focusType}

Return exactly this JSON shape:
{
  "roadmapType": "SHORT_TERM",
  "title": "string",
  "goal": "string",
  "summary": "string",
  "daysAvailable": ${a.daysAvailable},
  "hoursPerDay": ${a.hoursPerDay},
  "currentLevel": "${a.currentLevel}",
  "focusType": "${a.focusType}",
  "tasks": [
    {
      "day": 1,
      "topic": "string",
      "exercises": ["string"],
      "miniProject": "string",
      "resources": [{"name":"string","url":"https://..."}],
      "estimatedHours": ${a.hoursPerDay},
      "difficulty": 1,
      "schedule": {
        "morning": "string",
        "afternoon": "string",
        "evening": "string"
      }
    }
  ]
}`,7e3)}async function C(a){return A(`You are an expert academic and career coach. Create a structured long-term study plan.
CRITICAL: Include mock test schedules, revision cycles, and realistic milestones.
Weekly structure should be: Mon-Fri new topics, Saturday practice tests/problems, Sunday revision and review.
Return ONLY valid JSON.`,`Create a long-term roadmap for:
Goal: ${a.goal}
Target date or duration: ${a.targetDate}
Current level: ${a.currentLevel}
Hours per day: ${a.hoursPerDay}
Background: ${a.background}
Exam type: ${a.examType||"career"}

Return exactly this JSON shape:
{
  "roadmapType": "LONG_TERM",
  "title": "string",
  "goal": "string",
  "summary": "string",
  "targetDate": "${a.targetDate}",
  "hoursPerDay": ${a.hoursPerDay},
  "currentLevel": "${a.currentLevel}",
  "examType": "${a.examType||"career"}",
  "phases": [
    {
      "name": "Foundation",
      "order": 1,
      "startWeek": 1,
      "endWeek": 8,
      "weeklyMilestones": [
        {
          "week": 1,
          "focus": "string",
          "milestone": "string",
          "practiceTest": "string",
          "review": "string"
        }
      ],
      "keyTopicsChecklist": ["string"],
      "mockTestSchedule": ["string"],
      "resources": [{"name":"string","type":"book","url":"https://..."}],
      "progressCheckpoints": ["string"]
    }
  ]
}`,8e3)}async function D(a){let b=await (0,u.getServerSession)(v.N);if(!b?.user?.id)return(0,w.m)({error:"Unauthorized"},{status:401});let c=await a.json(),d=c.goal?.trim();if(!d)return(0,w.m)({error:"Goal is required"},{status:400});let e=c.type||function(a){let b=a.toLowerCase();return["upsc","neet","jee","gate","cat","gmat","gre","bar exam","ca","cfa","phd","degree","masters","mbbs","civil services","research","thesis","certification","career","2 years","3 years","4 years","5 years"].some(a=>b.includes(a))?"long_term":"short_term"}(d),f=c.color||"violet";if("short_term"===e){let a=await B({goal:d,currentLevel:c.currentLevel||"beginner",daysAvailable:c.duration,hoursPerDay:c.hoursPerDay,background:c.background||"",focusType:c.focusType||"mixed"}),g=await x.z.roadmap.create({data:{userId:b.user.id,title:a.title,goal:a.goal,description:a.summary,totalDays:a.daysAvailable,roadmapType:"SHORT_TERM",createdBy:"AI",color:f,projects:{create:[{name:"Daily Plan",color:f,order:0,startDay:1,endDay:a.daysAvailable}]}},include:{projects:!0}});return await x.z.task.createMany({data:a.tasks.map(a=>({roadmapId:g.id,projectId:g.projects[0]?.id||null,day:a.day,title:a.topic,description:`${a.schedule.morning}

${a.schedule.afternoon}

${a.schedule.evening}

Mini project: ${a.miniProject}`,techStack:[{name:a.topic,type:"other"},{name:`Difficulty ${a.difficulty}`,type:"other"}],resources:a.resources}))}),await y(d,"SHORT_TERM",c.duration),(0,w.m)({type:e,roadmap:a,id:g.id},{status:201})}let g=await C({goal:d,targetDate:c.targetDate||`${c.duration} days`,currentLevel:c.currentLevel||"beginner",hoursPerDay:c.hoursPerDay,background:c.background||"",examType:c.examType}),h=Math.max(c.duration,g.phases.at(-1)?.endWeek?7*g.phases.at(-1).endWeek:c.duration),i=await x.z.roadmap.create({data:{userId:b.user.id,title:g.title,goal:g.goal,description:g.summary,totalDays:h,roadmapType:"LONG_TERM",targetDate:c.targetDate?new Date(c.targetDate):null,createdBy:"AI",color:f,phases:{create:g.phases.map(a=>({name:a.name,order:a.order,startWeek:a.startWeek,endWeek:a.endWeek,milestones:a.weeklyMilestones,topics:a.keyTopicsChecklist}))},projects:{create:g.phases.map(a=>({name:a.name,color:f,order:a.order-1,startDay:(a.startWeek-1)*7+1,endDay:7*a.endWeek}))}},include:{phases:!0,projects:!0}});return await y(d,"LONG_TERM",h),(0,w.m)({type:e,roadmap:g,id:i.id},{status:201})}let E=new e.AppRouteRouteModule({definition:{kind:f.RouteKind.APP_ROUTE,page:"/api/roadmaps/generate/route",pathname:"/api/roadmaps/generate",filename:"route",bundlePath:"app/api/roadmaps/generate/route"},distDir:".next",relativeProjectDir:"",resolvedPagePath:"E:\\My project with git\\0001 RODMAPER\\app\\api\\roadmaps\\generate\\route.ts",nextConfigOutput:"",userland:d}),{workAsyncStorage:F,workUnitAsyncStorage:G,serverHooks:H}=E;function I(){return(0,g.patchFetch)({workAsyncStorage:F,workUnitAsyncStorage:G})}async function J(a,b,c){var d;let e="/api/roadmaps/generate/route";"/index"===e&&(e="/");let g=await E.prepare(a,b,{srcPage:e,multiZoneDraftMode:!1});if(!g)return b.statusCode=400,b.end("Bad Request"),null==c.waitUntil||c.waitUntil.call(c,Promise.resolve()),null;let{buildId:u,params:v,nextConfig:w,isDraftMode:x,prerenderManifest:y,routerServerContext:z,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,resolvedPathname:C}=g,D=(0,j.normalizeAppPath)(e),F=!!(y.dynamicRoutes[D]||y.routes[C]);if(F&&!x){let a=!!y.routes[C],b=y.dynamicRoutes[D];if(b&&!1===b.fallback&&!a)throw new s.NoFallbackError}let G=null;!F||E.isDev||x||(G="/index"===(G=C)?"/":G);let H=!0===E.isDev||!F,I=F&&!H,J=a.method||"GET",K=(0,i.getTracer)(),L=K.getActiveScopeSpan(),M={params:v,prerenderManifest:y,renderOpts:{experimental:{cacheComponents:!!w.experimental.cacheComponents,authInterrupts:!!w.experimental.authInterrupts},supportsDynamicResponse:H,incrementalCache:(0,h.getRequestMeta)(a,"incrementalCache"),cacheLifeProfiles:null==(d=w.experimental)?void 0:d.cacheLife,isRevalidate:I,waitUntil:c.waitUntil,onClose:a=>{b.on("close",a)},onAfterTaskError:void 0,onInstrumentationRequestError:(b,c,d)=>E.onRequestError(a,b,d,z)},sharedContext:{buildId:u}},N=new k.NodeNextRequest(a),O=new k.NodeNextResponse(b),P=l.NextRequestAdapter.fromNodeNextRequest(N,(0,l.signalFromNodeResponse)(b));try{let d=async c=>E.handle(P,M).finally(()=>{if(!c)return;c.setAttributes({"http.status_code":b.statusCode,"next.rsc":!1});let d=K.getRootSpanAttributes();if(!d)return;if(d.get("next.span_type")!==m.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${d.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let e=d.get("next.route");if(e){let a=`${J} ${e}`;c.setAttributes({"next.route":e,"http.route":e,"next.span_name":a}),c.updateName(a)}else c.updateName(`${J} ${a.url}`)}),g=async g=>{var i,j;let k=async({previousCacheEntry:f})=>{try{if(!(0,h.getRequestMeta)(a,"minimalMode")&&A&&B&&!f)return b.statusCode=404,b.setHeader("x-nextjs-cache","REVALIDATED"),b.end("This page could not be found"),null;let e=await d(g);a.fetchMetrics=M.renderOpts.fetchMetrics;let i=M.renderOpts.pendingWaitUntil;i&&c.waitUntil&&(c.waitUntil(i),i=void 0);let j=M.renderOpts.collectedTags;if(!F)return await (0,o.I)(N,O,e,M.renderOpts.pendingWaitUntil),null;{let a=await e.blob(),b=(0,p.toNodeOutgoingHttpHeaders)(e.headers);j&&(b[r.NEXT_CACHE_TAGS_HEADER]=j),!b["content-type"]&&a.type&&(b["content-type"]=a.type);let c=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=r.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,d=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=r.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:t.CachedRouteKind.APP_ROUTE,status:e.status,body:Buffer.from(await a.arrayBuffer()),headers:b},cacheControl:{revalidate:c,expire:d}}}}catch(b){throw(null==f?void 0:f.isStale)&&await E.onRequestError(a,b,{routerKind:"App Router",routePath:e,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})},z),b}},l=await E.handleResponse({req:a,nextConfig:w,cacheKey:G,routeKind:f.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:y,isRoutePPREnabled:!1,isOnDemandRevalidate:A,revalidateOnlyGenerated:B,responseGenerator:k,waitUntil:c.waitUntil});if(!F)return null;if((null==l||null==(i=l.value)?void 0:i.kind)!==t.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==l||null==(j=l.value)?void 0:j.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,h.getRequestMeta)(a,"minimalMode")||b.setHeader("x-nextjs-cache",A?"REVALIDATED":l.isMiss?"MISS":l.isStale?"STALE":"HIT"),x&&b.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let m=(0,p.fromNodeOutgoingHttpHeaders)(l.value.headers);return(0,h.getRequestMeta)(a,"minimalMode")&&F||m.delete(r.NEXT_CACHE_TAGS_HEADER),!l.cacheControl||b.getHeader("Cache-Control")||m.get("Cache-Control")||m.set("Cache-Control",(0,q.getCacheControlHeader)(l.cacheControl)),await (0,o.I)(N,O,new Response(l.value.body,{headers:m,status:l.value.status||200})),null};L?await g(L):await K.withPropagatedContext(a.headers,()=>K.trace(m.BaseServerSpan.handleRequest,{spanName:`${J} ${a.url}`,kind:i.SpanKind.SERVER,attributes:{"http.method":J,"http.target":a.url}},g))}catch(b){if(b instanceof s.NoFallbackError||await E.onRequestError(a,b,{routerKind:"App Router",routePath:D,routeType:"route",revalidateReason:(0,n.c)({isRevalidate:I,isOnDemandRevalidate:A})}),F)throw b;return await (0,o.I)(N,O,new Response(null,{status:500})),null}}},11723:a=>{"use strict";a.exports=require("querystring")},11997:a=>{"use strict";a.exports=require("punycode")},12412:a=>{"use strict";a.exports=require("assert")},19121:a=>{"use strict";a.exports=require("next/dist/server/app-render/action-async-storage.external.js")},27910:a=>{"use strict";a.exports=require("stream")},28354:a=>{"use strict";a.exports=require("util")},29021:a=>{"use strict";a.exports=require("fs")},29294:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:a=>{"use strict";a.exports=require("path")},37830:a=>{"use strict";a.exports=require("node:stream/web")},44870:a=>{"use strict";a.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55511:a=>{"use strict";a.exports=require("crypto")},55591:a=>{"use strict";a.exports=require("https")},57075:a=>{"use strict";a.exports=require("node:stream")},63033:a=>{"use strict";a.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},66147:(a,b,c)=>{"use strict";c.d(b,{N:()=>h});var d=c(75783),e=c(53811),f=c(23168),g=c(70373);let h={adapter:(0,f.y)(g.z),providers:[(0,d.A)({clientId:process.env.GOOGLE_CLIENT_ID||"",clientSecret:process.env.GOOGLE_CLIENT_SECRET||""}),(0,e.A)({clientId:process.env.GITHUB_ID||"",clientSecret:process.env.GITHUB_SECRET||""})],session:{strategy:"jwt"},callbacks:{session:async({session:a,token:b})=>(b.sub&&a.user&&(a.user.id=b.sub),a),jwt:async({token:a,user:b})=>(b&&(a.sub=b.id),a)},pages:{signIn:"/login"},secret:process.env.NEXTAUTH_SECRET}},70373:(a,b,c)=>{"use strict";c.d(b,{z:()=>e});var d=c(96330);let e=globalThis.prisma??new d.PrismaClient({log:["error"]})},73024:a=>{"use strict";a.exports=require("node:fs")},73566:a=>{"use strict";a.exports=require("worker_threads")},74075:a=>{"use strict";a.exports=require("zlib")},78335:()=>{},79428:a=>{"use strict";a.exports=require("buffer")},79551:a=>{"use strict";a.exports=require("url")},81630:a=>{"use strict";a.exports=require("http")},84941:(a,b,c)=>{"use strict";c.d(b,{m:()=>e});var d=c(10641);function e(a,b={},c=30){return d.NextResponse.json(a,{...b,headers:{...b.headers,"Cache-Control":`private, max-age=${c}`}})}},86439:a=>{"use strict";a.exports=require("next/dist/shared/lib/no-fallback-error.external")},94735:a=>{"use strict";a.exports=require("events")},96330:a=>{"use strict";a.exports=require("@prisma/client")},96487:()=>{}};var b=require("../../../../webpack-runtime.js");b.C(a);var c=b.X(0,[833,692,253],()=>b(b.s=11107));module.exports=c})();