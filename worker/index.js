// Run before assets so HTTP URLs and HTML aliases have one canonical URL.
const host = "mellomelt.corstack.dev";
const pages = {"/":"/index.html"};
export default {
 async fetch(request, env) {
  const url = new URL(request.url);
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  let canonicalPath = url.pathname;
  for (const route of Object.keys(pages)) {
   const aliases = route === '/' ? ['/index','/index.html'] : [route+'/',route+'.html',route+'/index',route+'/index.html'];
   if(aliases.includes(url.pathname)) canonicalPath = route;
  }
  if(!local && (url.protocol !== 'https:' || url.hostname !== host) || canonicalPath !== url.pathname) {
   url.pathname=canonicalPath;
   if(!local){url.protocol='https:';url.hostname=host;url.port='';}
   return Response.redirect(url.href,301);
  }
  if(!['GET','HEAD'].includes(request.method)) return new Response(null,{status:405,headers:{Allow:'GET, HEAD'}});
  const page = pages[url.pathname];
  if(page) url.pathname=page;
  let response = await env.ASSETS.fetch(new Request(url,request));
  if(response.status===404 || url.pathname==='/404.html') {
   const errorURL = new URL('/404.html',request.url);
   const error = await env.ASSETS.fetch(new Request(errorURL,{method:request.method}));
   return new Response(request.method==='HEAD'?null:error.body,{status:404,headers:{'Content-Type':'text/html; charset=utf-8','X-Robots-Tag':'noindex','Cache-Control':'no-cache'}});
  }
  if(url.pathname==='/wishlist.html') {
   response = new Response(response.body,response);
   response.headers.set('X-Robots-Tag','noindex');
  }
  return response;
 }
};
