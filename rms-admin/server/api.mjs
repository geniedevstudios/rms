import { createReadStream } from 'node:fs';
import { readFile, mkdir, stat, rename, unlink } from 'node:fs/promises';
import { resolve, extname, basename } from 'node:path';
import { randomUUID, randomBytes, timingSafeEqual, createHash } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';
import { createWriteStream } from 'node:fs';
import { createContentStore, publicContent, HttpError } from './content-store.mjs';
import { uploadToCloudinary, destroyCloudinary } from './cloudinary.mjs';
const root=resolve(import.meta.dirname,'..');
const types={'.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.gif':'image/gif','.mp4':'video/mp4','.webm':'video/webm','.woff2':'font/woff2','.css':'text/css','.js':'text/javascript','.html':'text/html'};
export async function serveFile(req,res,path){
 const info=await stat(path);if(!info.isFile())throw new HttpError(404,'File not found.');
 const headers={'Content-Type':types[extname(path)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
 const range=req.headers.range;
 if(range){const match=/^bytes=(\d+)-(\d*)$/.exec(range);if(!match){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}const start=Number(match[1]);const end=match[2]?Math.min(Number(match[2]),info.size-1):info.size-1;if(start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}res.writeHead(206,{...headers,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${info.size}`});if(req.method==='HEAD')return res.end();return pipeline(createReadStream(path,{start,end}),res);}
 res.writeHead(200,{...headers,'Content-Length':info.size});if(req.method==='HEAD')return res.end();return pipeline(createReadStream(path),res);
}
async function jsonBody(req){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>2e6)throw new HttpError(413,'Content is too large.');chunks.push(chunk);}try{return JSON.parse(Buffer.concat(chunks).toString());}catch{throw new HttpError(400,'Invalid request.');}}
function mediaType(bytes){if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return ['png','image'];if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return ['jpg','image'];if(['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString()))return ['gif','image'];if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')return ['webp','image'];if(bytes.subarray(4,8).toString()==='ftyp')return ['mp4','video'];if(bytes.subarray(0,4).equals(Buffer.from([26,69,223,163])))return ['webm','video'];throw new HttpError(400,'Upload a JPG, PNG, WebP, GIF, MP4, or WebM file.');}
export function createApi({directory=resolve(root,'data'),password=process.env.RMS_ADMIN_PASSWORD,production=false,cloudinary=null}={}){
 if(production&&(!password||password.length<12))throw new Error('Set RMS_ADMIN_PASSWORD to at least 12 characters before starting a production admin server.');
 const store=createContentStore(directory);const sessions=new Map();const attempts=new Map();
 const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
 function authenticated(req){if(!password)return true;const id=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('rms_admin='))?.slice(10);const expiry=sessions.get(id);if(expiry>Date.now())return true;sessions.delete(id);return false;}
 return async function api(req,res,next=()=>send(res,404,{error:'Not found.'})){
  const path=new URL(req.url,'http://localhost').pathname;
  const isApi=path.startsWith('/api/cms/');const isUpload=path.startsWith('/uploads/');const isAsset=path.startsWith('/images/')||path.startsWith('/videos/');
  if(!isApi&&!isUpload&&!isAsset)return next();
  try{
   if(isUpload||isAsset){if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Method not allowed.');const allowed=isUpload?/^\/uploads\/[a-f0-9-]+\.(jpg|png|webp|gif|mp4|webm)$/:/^\/(images|videos)\/[a-zA-Z0-9._-]+$/;if(!allowed.test(path))throw new HttpError(404,'File not found.');return await serveFile(req,res,isUpload?resolve(directory,path.slice(1)):resolve(root,'../rms-app/public',path.slice(1)));}
   if(path==='/api/cms/published'&&req.method==='GET'){const s=await store.read();return send(res,200,{content:publicContent(s.published),revision:s.publishedRevision});}
   // Writes and private reads must come from this admin origin, never a third-party page.
   if(req.headers.origin){const origin=new URL(req.headers.origin);if(origin.host!==req.headers.host)throw new HttpError(403,'Open the admin dashboard to make this change.');}
   if(path==='/api/cms/session'&&req.method==='GET')return send(res,200,{authenticated:authenticated(req),localMode:!password});
   if(path==='/api/cms/login'&&req.method==='POST'){
    const ip=req.socket.remoteAddress;const previous=attempts.get(ip);const entry=previous&&previous.until>Date.now()?previous:{count:0,until:Date.now()+15*60e3};if(entry.count>=10)throw new HttpError(429,'Too many attempts. Try again in 15 minutes.');entry.count++;attempts.set(ip,entry);
    const body=await jsonBody(req);const hash=v=>createHash('sha256').update(v).digest();if(!password||typeof body.password!=='string'||!timingSafeEqual(hash(body.password),hash(password)))throw new HttpError(401,'That password is not correct.');
    attempts.delete(ip);const token=randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*60*60e3);res.setHeader('Set-Cookie',`rms_admin=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE==='true'?'; Secure':''}`);return send(res,200,{authenticated:true,localMode:false});
   }
   if(!authenticated(req))throw new HttpError(401,'Please sign in to continue.');
   if(path==='/api/cms/logout'&&req.method==='POST'){const id=(req.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith('rms_admin='))?.slice(10);sessions.delete(id);res.setHeader('Set-Cookie','rms_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return send(res,200,{ok:true});}
   if(path==='/api/cms/state'&&req.method==='GET')return send(res,200,await store.read());
   if(path==='/api/cms/draft'&&req.method==='PUT'){const b=await jsonBody(req);return send(res,200,await store.save(b.content,b.revision));}
   if(path==='/api/cms/publish'&&req.method==='POST'){const b=await jsonBody(req);return send(res,200,await store.publish(b.revision));}
   if(path==='/api/cms/discard'&&req.method==='POST'){const b=await jsonBody(req);return send(res,200,await store.discard(b.revision));}
   if(path==='/api/cms/upload'&&req.method==='POST'){
    const dir=resolve(directory,'uploads');await mkdir(dir,{recursive:true});const id=randomUUID();const temp=resolve(dir,id+'.tmp');let size=0;let head=Buffer.alloc(0);
    try{await pipeline(req,new Transform({transform(chunk,_,done){size+=chunk.length;if(size>100*1024*1024)return done(new HttpError(413,'Files must be under 100 MB.'));if(head.length<32)head=Buffer.concat([head,chunk.subarray(0,32-head.length)]);done(null,chunk);}}),createWriteStream(temp,{flags:'wx'}));const [extension,type]=mediaType(head);if(type==='image'&&size>15*1024*1024)throw new HttpError(413,'Images must be under 15 MB.');const filename=id+'.'+extension;const stored=resolve(dir,filename);await rename(temp,stored);let name;try{name=decodeURIComponent(req.headers['x-file-name']||'Upload');}catch{name='Upload';}let url='/uploads/'+filename;if(cloudinary){try{url=await uploadToCloudinary(stored,{...cloudinary,resourceType:type==='video'?'video':'image',publicId:id});}finally{await unlink(stored).catch(()=>{});}}const asset={id,name:basename(name).slice(0,160),url,type,alt:'',size,createdAt:new Date().toISOString()};try{const state=await store.addMedia(asset);return send(res,201,{asset,state});}catch(error){if(cloudinary)await destroyCloudinary(url,cloudinary).catch(()=>{});else await unlink(stored).catch(()=>{});throw error;}}finally{await unlink(temp).catch(()=>{});}
   }
   const match=/^\/api\/cms\/media\/([a-z0-9-]+)$/.exec(path);
   if(match&&req.method==='PATCH'){const b=await jsonBody(req);return send(res,200,await store.editMedia(match[1],b.alt));}
   if(match&&req.method==='DELETE'){const before=await store.read();const asset=before.media.find(m=>m.id===match[1]);const state=await store.removeMedia(match[1]);if(asset?.url.startsWith('/uploads/'))await unlink(resolve(directory,asset.url.slice(1))).catch(()=>{});else if(asset)await destroyCloudinary(asset.url,cloudinary).catch(()=>{});return send(res,200,state);}
   throw new HttpError(404,'Not found.');
  }catch(error){if(res.headersSent)return res.destroy();send(res,error.status||(error.code==='ENOENT'?404:500),{error:error.status?error.message:error.code==='ENOENT'?'File not found.':'Unable to complete the request. Please try again.'});}
 };
}
