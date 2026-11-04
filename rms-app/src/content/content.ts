import defaults from '../../../rms-admin/shared/default-content.json';
import type { Content } from '../../../rms-admin/shared/content.types';
export let hasPublishedContent = false;
export let siteContent = defaults as Content;
export async function loadPublishedContent(origin='', strict=false) {
  try {
    const response=await fetch(`${origin}/api/cms/published`,{signal:AbortSignal.timeout(4000)});
    if(!response.ok)throw new Error('Content service unavailable');
    const {content}=await response.json();
    if(!content?.hero?.slides?.length||!Array.isArray(content.products)||!Array.isArray(content.slots)||!Array.isArray(content.journals))throw new Error('Invalid content');
    siteContent=content as Content;
    hasPublishedContent = true;
  } catch(error) { if(strict)throw error; }
}
export function mediaSlot(id:string){const slot=siteContent.slots.find(s=>s.id===id);if(!slot)throw new Error(`Missing content placement: ${id}`);return slot;}
