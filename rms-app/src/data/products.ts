import type { Product } from '../types/product';
import { siteContent } from '../content/content';
export const shopCategories = ['Pants','Tops','Two piece','Skirts'] as const;
export const products:Product[]=siteContent.products.filter(p=>p.status==='active');
export const sizes=['XS','S','M','L','XL'];
