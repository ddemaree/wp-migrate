import TurndownService from 'turndown';
import { isCodeBlock, isEmbedBlock, isGalleryBlock, isImageBlock } from './selectors';
import { processGutenbergContent } from './processContent';
import { updateImageReferences } from './updateImageReferences';
import { WpExportData } from './wpXmlParser';


function getTurndownService() {
  const turndownService = new TurndownService();
  
  turndownService.addRule('embed', {
    filter: (node) => isEmbedBlock(node),
    replacement: (content, node) => {
      const embedType = (node as HTMLElement).getAttribute('data-wp-type');
      return `![${embedType}](embed://${embedType})`;
    }
  });

  turndownService.addRule('gallery', {
    filter: (node) => isGalleryBlock(node),
    replacement: (_content, node) => {
      const element = node as HTMLElement;
      const images = element.querySelectorAll('img');
      const imageUrls = Array.from(images).map(img => img.getAttribute('src') || '');
      // Export image URLs as an unordered list
      return imageUrls.map((url, index) => `- ![Image ${index + 1}](${url})`).join('\n');
    }
  });
  
  turndownService.addRule('imageBlock', {
    filter: (node) => isImageBlock(node),
    replacement: (_content, node) => {
      const element = node as HTMLElement;
      const image = element.querySelector('img');
      const alt = image?.getAttribute('alt') || '';
      const src = image?.getAttribute('src') || '';
      return `![${alt}](${src})`;
    }
  });

  turndownService.addRule('codeBlock', {
    filter: (node) => isCodeBlock(node),
    replacement: (content, node) => {
      const element = node as HTMLElement;
      const code = element.querySelector('code');
      const lang = code?.getAttribute('lang') || element.getAttribute('class')?.replace('language-', '') || code?.getAttribute('class')?.replace('language-', '');
      return `\`\`\`${lang}\n${code?.textContent}\n\`\`\``;
    }
  });
  
  return turndownService;
}

export function htmlToMarkdown(html: string, slug: string, exportSiteData: WpExportData): string {
  const processedHtml = updateImageReferences(processGutenbergContent(html, '', slug), slug, exportSiteData);
  return getTurndownService().turndown(processedHtml);
}
