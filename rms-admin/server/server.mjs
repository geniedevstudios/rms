import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { createApi, serveFile } from './api.mjs';
import { cloudinaryConfig } from './cloudinary.mjs';
const api=createApi({production:true,cloudinary:cloudinaryConfig()});
const dist=resolve(import.meta.dirname,'../dist');
createServer((req,res)=>api(req,res,async()=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const path=pathname.startsWith('/assets/')&&/^\/assets\/[a-zA-Z0-9._-]+$/.test(pathname)?resolve(dist,pathname.slice(1)):resolve(dist,'index.html');await serveFile(req,res,path);}catch{res.writeHead(404);res.end('Not found');}})).listen(Number(process.env.PORT||5175),process.env.HOST||'127.0.0.1',()=>console.log('RMS admin ready on port '+(process.env.PORT||5175)));
