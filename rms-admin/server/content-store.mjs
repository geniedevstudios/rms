import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
const seed = JSON.parse(await readFile(new URL('../shared/default-content.json', import.meta.url), 'utf8'));
const initialMedia = JSON.parse(await readFile(new URL('./default-media.json', import.meta.url), 'utf8'));
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
const check=(condition,message)=>{if(!condition)throw new HttpError(400,message);};
const text=(value,max=500)=>typeof value==='string' && value.length<=max;
const slug=value=>typeof value==='string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length<=80;
export function references(content){
 const refs=[];
 const add=(url,label)=>{if(url)refs.push({url,label});};
 content.hero.slides.forEach(s=>add(s.src,'Home hero'));
 content.slots.forEach(s=>add(s.src,s.label));
 content.categoryCards.forEach(s=>{add(s.image,s.title+' category');add(s.hover,s.title+' hover');});
 [...content.products,...content.customDesigns].forEach(p=>{add(p.image,p.name);add(p.hoverImage,p.name+' hover');});
 content.collections.forEach(c=>add(c.image,c.label));
 content.journals.forEach(j=>{add(j.image,j.title);add(j.hover,j.title+' hover');});
 return refs;
}
export function publicContent(content){
 const result=structuredClone(content);
 result.products=result.products.filter(p=>p.status==='active');
 result.customDesigns=result.customDesigns.filter(p=>p.status==='active');
 result.journals=result.journals.filter(j=>j.status==='published');
 result.collections=result.collections.filter(c=>c.status==='published').map(c=>({...c,productIds:c.productIds.filter(id=>result.products.some(p=>p.id===id))}));
 return result;
}
export function validateContent(c,media){
 check(c && typeof c==='object','Content is required.');
 for(const key of ['slots','categoryCards','products','customDesigns','collections','journals'])check(Array.isArray(c[key])&&c[key].length<=200,`Invalid ${key}.`);
 const h=c.hero;check(h&&Array.isArray(h.slides)&&h.slides.length>0&&h.slides.length<=12,'Add between 1 and 12 hero slides.');
 for(const key of ['eyebrow','title','description','buttonLabel','caption'])check(text(h[key],1000)&&h[key].trim(),`Hero ${key} is required.`);
 check(typeof h.buttonHref==='string'&&/^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(h.buttonHref),'Choose a storefront path for the hero button.');
 check(Number.isFinite(h.interval)&&h.interval>=4&&h.interval<=30,'Hero rotation must be between 4 and 30 seconds.');
 const byUrl=new Map(media.map(m=>[m.url,m]));
 const image=url=>!url||(byUrl.get(url)?.type==='image');
 const ids=new Set();
 for(const p of [...c.products,...c.customDesigns]){
  check(slug(p.id)&&!ids.has(p.id),'Product handles must be unique.');ids.add(p.id);
  check(text(p.name)&&p.name.trim(),'Every product needs a name.');
  check(['Pants','Tops','Two piece','Skirts','Dresses'].includes(p.category),'Choose a product category.');
  check(Number.isFinite(p.price)&&p.price>=0&&p.price<=1e7,'Enter a valid product price.');
  check(text(p.color)&&/^#[0-9a-fA-F]{6}$/.test(p.swatch),'Choose a valid colour and swatch.');
  check(text(p.description,10000)&&text(p.fabric,1000)&&(!p.tag||text(p.tag,100)),'Product descriptions are too long.');
  check(['active','draft'].includes(p.status),'Choose a product status.');
  check(p.image&&image(p.image)&&image(p.hoverImage),'Product photography must be images.');
  check(p.leadDays===undefined||(Number.isInteger(p.leadDays)&&p.leadDays>=1&&p.leadDays<=365),'Lead time must be 1–365 days.');
 }
 for(const list of [c.journals,c.collections,c.slots,c.categoryCards,h.slides]){
  const unique=new Set();for(const item of list){check(item&&slug(item.id)&&!unique.has(item.id),'Each item needs a unique handle.');unique.add(item.id);}
 }
 for(const j of c.journals){
  check(text(j.title)&&j.title.trim()&&text(j.label)&&text(j.excerpt,2000)&&text(j.body,60000)&&text(j.alt),'Complete the journal title and text.');
  check(j.image&&image(j.image)&&image(j.hover),'Journal covers must be images.');
  check(['published','draft'].includes(j.status)&&typeof j.featured==='boolean','Invalid journal status.');
  check(Number.isInteger(j.readMinutes)&&j.readMinutes>=1&&j.readMinutes<=120,'Reading time must be 1–120 minutes.');
 }
 for(const col of c.collections){
  check(text(col.label)&&col.label.trim()&&text(col.imageAlt)&&col.image&&image(col.image),'Complete the collection label and image.');
  check(Array.isArray(col.title)&&col.title.length>0&&col.title.length<=10&&col.title.every(t=>text(t.text)&&t.text.trim()),'Collection title is required.');
  check(Array.isArray(col.description)&&col.description.length<=10&&col.description.every(t=>text(t,2000)),'Invalid collection description.');
  check(Array.isArray(col.productIds)&&col.productIds.every(id=>c.products.some(p=>p.id===id)),'A collection references a missing product.');
  check(['published','draft'].includes(col.status),'Invalid collection status.');
  if(col.statement)check(text(col.statement.eyebrow)&&Array.isArray(col.statement.lines)&&col.statement.lines.length<=10&&col.statement.lines.every(t=>text(t.text)),'Invalid collection statement.');
 }
 check(c.slots.length===seed.slots.length&&seed.slots.every(s=>c.slots.some(x=>x.id===s.id)),'Keep all website media placements.');
 for(const s of c.slots){
  check(text(s.label)&&text(s.group)&&text(s.alt)&&text(s.description,2000),'Invalid media placement.');
  check(byUrl.get(s.src)?.type===(s.id==='atelier-film'?'video':'image'),'Choose the correct media type for '+s.label+'.');
 }
 for(const s of h.slides)check(text(s.alt)&&['image','video'].includes(s.type)&&byUrl.get(s.src)?.type===s.type,'Choose a valid hero image or video.');
 for(const s of c.categoryCards)check(text(s.title)&&text(s.subtitle)&&image(s.image)&&s.image&&image(s.hover)&&typeof s.to==='string'&&/^\/(?!\/)[a-zA-Z0-9/?=&%._#-]*$/.test(s.to),'Invalid category card.');
 for(const ref of references(c))check(byUrl.has(ref.url),'Choose media from the library for '+ref.label+'.');
 return c;
}
export function createContentStore(directory){
 const file=resolve(directory,'content.json');let queue=Promise.resolve();
 async function read(){try{return JSON.parse(await readFile(file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;return {draft:structuredClone(seed),published:structuredClone(seed),media:structuredClone(initialMedia),revision:0,publishedRevision:0,publishedAt:null,activity:[]};}}
 function transact(action){const job=queue.then(async()=>{const state=await read();const message=action(state);state.activity=[{id:randomUUID(),at:new Date().toISOString(),message},...state.activity].slice(0,40);await mkdir(dirname(file),{recursive:true});const temp=file+'.'+randomUUID()+'.tmp';await writeFile(temp,JSON.stringify(state,null,2));await rename(temp,file);return state;});queue=job.catch(()=>{});return job;}
 function revision(s,expected){if(s.revision!==expected)throw new HttpError(409,'Content changed in another session. Reload the latest version before saving.');}
 return {read,
 save:(draft,expected)=>transact(s=>{revision(s,expected);s.draft=validateContent(draft,s.media);s.revision++;return 'Saved a content draft';}),
 publish:expected=>transact(s=>{revision(s,expected);validateContent(s.draft,s.media);s.published=structuredClone(s.draft);s.publishedRevision=s.revision;s.publishedAt=new Date().toISOString();return 'Published the storefront';}),
 discard:expected=>transact(s=>{revision(s,expected);s.draft=structuredClone(s.published);s.revision++;s.publishedRevision=s.revision;return 'Restored the published version';}),
 addMedia:asset=>transact(s=>{s.media.unshift(asset);return 'Uploaded '+asset.name;}),
 editMedia:(id,alt)=>transact(s=>{check(text(alt),'Alternative text must be under 500 characters.');const asset=s.media.find(m=>m.id===id);if(!asset)throw new HttpError(404,'Media not found.');asset.alt=alt;return 'Updated media description';}),
 removeMedia:id=>transact(s=>{const asset=s.media.find(m=>m.id===id);if(!asset)throw new HttpError(404,'Media not found.');check(asset.url.startsWith('/uploads/')||asset.url.startsWith('https://res.cloudinary.com/'),'Original storefront assets cannot be deleted.');check(![...references(s.draft),...references(s.published)].some(r=>r.url===asset.url),'This file is still used in a draft or on the published storefront. Replace it there first.');s.media=s.media.filter(m=>m.id!==id);return 'Removed '+asset.name;})
 };
}
