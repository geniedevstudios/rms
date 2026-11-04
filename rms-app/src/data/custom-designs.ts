import type { Product } from '../types/product';
import { siteContent } from '../content/content';
export type CustomDesign=Product & {leadDays:number};
export const consultationFee=250;
export const customDesigns:CustomDesign[]=siteContent.customDesigns.filter(p=>p.status==='active').map(p=>({...p,leadDays:p.leadDays||21}));
