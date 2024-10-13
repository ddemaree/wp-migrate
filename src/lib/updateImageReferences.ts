import { WpExportData } from "./wpXmlParser";
import { JSDOM } from 'jsdom';

export function updateImageReferences(content: string | Document, slug: string, exportSiteData: WpExportData): Document {
  
  if(typeof content === 'string') {
    const dom = new JSDOM(content, {
      url: `https://demaree.me/p/${slug}`,
    });
    content = dom.window.document;
  }

  // Get site URL from site data
  const siteUrl = exportSiteData.site.base_site_url;
  const attachments = exportSiteData.attachments;
  
  const images = content.getElementsByTagName('img');
  for (const img of images) {
    const src = img.getAttribute('src');
    if (src && src.startsWith(siteUrl)) {
      // Remove site URL from beginning of src
      const newSrc = src.replace(siteUrl, '');
      img.setAttribute('src', newSrc);
    }
  }

  return content;
}

