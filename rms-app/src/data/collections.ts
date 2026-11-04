import { siteContent } from '../content/content';
export type { Collection } from '../../../rms-admin/shared/content.types';
export const collections=siteContent.collections.filter(c=>c.status==='published');
