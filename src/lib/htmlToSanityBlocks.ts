import { htmlToBlocks as _htmlToBlocks, ArbitraryTypedObject, type DeserializerRule } from '@sanity/block-tools';
import { Schema } from '@sanity/schema';
import { schema as schemaTypes } from '../schema';
import { processGutenbergContent } from './processContent';
const schema = Schema.compile({types: schemaTypes.types});

const blockContentType = schema
  .get('post')
  .fields.find((field: any) => field.name === 'content').type;

type BlockOutput = ReturnType<typeof _htmlToBlocks>;

const codeBlockRule: DeserializerRule = {
  deserialize(node, _next, createBlock) {
    const element = node as HTMLElement;

    const isTopLevelBlock = element.parentNode?.nodeName === 'BODY'

    if (!isTopLevelBlock || element.nodeName !== 'PRE') {
      return undefined;
    }

    const code = element.querySelector('code');

    if (!code) {
      return undefined;
    }

    const lang = code.getAttribute('lang') || element.getAttribute('class')?.replace('language-', '');
    const codeContent = code.textContent;

    return createBlock({
      _type: 'code',
      language: lang,
      code: codeContent,
    });
  },
}

type CreateBlock = (props: ArbitraryTypedObject) => {
    _type: string;
    block: ArbitraryTypedObject;
};

function deserializeImage(element: HTMLElement, createBlock: CreateBlock) {
  let img: HTMLImageElement | null = null;
  let alt: string | null = null;
  let caption: string | null = null;

  if (element.tagName === 'IMG') {
    img = element as HTMLImageElement;
    alt = img.alt;
    caption = img.title;
  } else {
    img = element.querySelector('img') as HTMLImageElement;
    alt = img.alt;
    caption = element.querySelector('figcaption')?.textContent ?? null;
  }
  
  if (!img) {
    return undefined;
  }

  let src = img?.src;

  if (src.match(/demaree\.me\/wp-content/)) {
    return createBlock({
      _type: 'image',
      _sanityAsset: `image@${src}`,
      alt,
      caption,
    });
  } else {
    return createBlock({
      _type: 'embed',
      url: src,
      embedType: 'image',
      alt,
      caption,
    });
  }
}

const imageBlockRule: DeserializerRule = {
  deserialize(node, _next, createBlock) {
    const element = node as HTMLElement;
    const isTopLevelBlock = element.parentNode?.nodeName === 'BODY'

    if (!isTopLevelBlock || !['FIGURE', 'IMG'].includes(element.tagName) || element.dataset['wpType'] !== 'image') {
      return undefined;
    }

    return deserializeImage(element, createBlock);
  }
}

const galleryBlockRule: DeserializerRule = {
  deserialize(node, _next, createBlock) {
    const element = node as HTMLElement;
    const isTopLevelBlock = element.parentNode?.nodeName === 'BODY'
    const wpType = element?.dataset?.['wpType'];

    if (!isTopLevelBlock || !wpType || wpType !== 'gallery') {
      return undefined;
    }

    let images = Array.from(element.querySelectorAll('img'));
    
    // @ts-ignore
    let imageBlocks = images.map(image => deserializeImage(image as HTMLElement, (props) => props));

    let columns = element.dataset['columns'] || 2;

    let caption = Array.from(element.children)
      .find(child => child.tagName === 'FIGCAPTION')?.textContent?.trim() || null;

    return createBlock({
      _type: 'gallery',
      images: imageBlocks,
      caption,
      columns,
    });
  }
}

const embedBlockRule: DeserializerRule = {
  deserialize(node, _next, createBlock) {
    const element = node as HTMLElement;
    const isTopLevelBlock = element.parentNode?.nodeName === 'BODY'
    const wpType = element?.dataset?.['wpType'];

    if (!isTopLevelBlock || !wpType || wpType !== 'embed') {
      return undefined;
    }

    let embedProvider = element.dataset['providerNameSlug'];
    let embedUrl: string | URL | null = null;
    
    try {
      embedUrl = new URL(element.dataset['url'] || element.querySelector('div')?.textContent || '');
    } catch (e) {
      embedUrl = null;
    }

    if (embedUrl && embedUrl.hostname === 'twitter.com') {
      embedProvider = 'twitter';
      embedUrl.hostname = 'x.com';
    }

    return createBlock({
      _type: 'embed',
      url: embedUrl,
      embedType: 'embed',
    });
  }
}

export function htmlToSanityBlocks(html: string, slug: string): BlockOutput {
  return _htmlToBlocks(html, blockContentType, {
    parseHtml: (html) => {
      return processGutenbergContent(html, '', slug);
    },
    rules: [imageBlockRule, codeBlockRule, embedBlockRule, galleryBlockRule],
  });
}
