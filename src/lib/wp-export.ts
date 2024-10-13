import { parseString } from 'xml2js';
import { promises as fs } from 'fs';
import path from 'path';
import { unserialize } from './php-unserialize';
import matter from 'gray-matter';
import TurndownService from 'turndown';
import fetch from 'node-fetch';
import { parse as parseUrl, resolve as resolveUrl } from 'url';
import { JSDOM } from 'jsdom';

const turndownService = new TurndownService();
const LOCAL_DOMAIN = 'demaree.me';
const LOCAL_CONTENT_PATH = '/wp-content/';

interface WPItem {
  title: string;
  link: string;
  pubDate: string;
  creator: string;
  guid: string;
  description: string;
  content: string;
  excerpt: string;
  post_id: string;
  post_date: string;
  post_date_gmt: string;
  comment_status: string;
  ping_status: string;
  post_name: string;
  status: string;
  post_parent: string;
  menu_order: string;
  post_type: string;
  post_password: string;
  is_sticky: string;
  category: string[];
  postmeta: { key: string; value: string }[];
}

export async function parseWPXML(filePath: string): Promise<any> {
  const xmlData = await fs.readFile(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function unserializePostMeta(postmeta: { key: string; value: string }[]): any {
  return postmeta.reduce((acc, { key, value }) => {
    try {
      acc[key] = unserialize(value);
    } catch {
      acc[key] = value;
    }
    return acc;
  }, {});
}

async function writeJSON(data: any, fileName: string): Promise<void> {
  await fs.writeFile(fileName, JSON.stringify(data, null, 2), { flag: "w" });
}

async function writeMarkdown(content: string, frontmatter: any, fileName: string): Promise<void> {
  const mdContent = matter.stringify(content, frontmatter);
  await fs.writeFile(fileName, mdContent, { flag: "w" });
}

async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = await response.buffer();
  await fs.writeFile(outputPath, buffer, { flag: "w" });
}

function isLocalUrl(url: string): boolean {
  const parsedUrl = parseUrl(url);
  return Boolean(parsedUrl.hostname === LOCAL_DOMAIN && parsedUrl.pathname?.startsWith(LOCAL_CONTENT_PATH));
}

async function processContent(content: string, outputDir: string, slug: string): Promise<string> {
  const dom = new JSDOM(content);
  const document = dom.window.document;

  // Process blocks
  const blocks = document.querySelectorAll('.wp-block');
  for (const block of blocks) {
    if (block.classList.contains('wp-block-paragraph') || 
        block.classList.contains('wp-block-heading') ||
        block.classList.contains('wp-block-list')) {
      // @ts-ignore
      const markdown = turndownService.turndown(block.innerHTML);
      block.outerHTML = markdown;
    }
  }

  // Process images and other attachments
  const media = document.querySelectorAll('img, a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]');
  for (const element of media) {
    let url: string;
    if (element.tagName === 'IMG') {
      url = element.getAttribute('src') || '';
    } else {
      url = element.getAttribute('href') || '';
    }

    if (isLocalUrl(url)) {
      const filename = path.basename(url);
      const localPath = path.join(outputDir, 'posts', slug, filename);
      await downloadFile(url, localPath);
      
      if (element.tagName === 'IMG') {
        element.setAttribute('src', filename);
      } else {
        element.setAttribute('href', filename);
      }
    }
  }

  return document.body.innerHTML;
}

async function migrateWPContent(xmlFilePath: string, outputDir: string): Promise<void> {
  const wpData = await parseWPXML(xmlFilePath);
  const channel = wpData.rss.channel[0];

  // Extract and write metadata
  const metadata = {
    title: channel.title[0],
    link: channel.link[0],
    description: channel.description[0],
    pubDate: channel.pubDate[0],
    language: channel.language[0],
    wxr_version: channel['wp:wxr_version'][0],
    base_site_url: channel['wp:base_site_url'][0],
    base_blog_url: channel['wp:base_blog_url'][0],
  };
  await writeJSON(metadata, path.join(outputDir, 'metadata.json'));

  // Extract and write categories
  const categories = channel['wp:category'].map(cat => ({
    term_id: cat['wp:term_id'][0],
    category_nicename: cat['wp:category_nicename'][0],
    category_parent: cat['wp:category_parent'][0],
    cat_name: cat['wp:cat_name'][0],
  }));
  await writeJSON(categories, path.join(outputDir, 'categories.json'));

  // Extract and write tags
  const tags = channel['wp:tag'].map(tag => ({
    term_id: tag['wp:term_id'][0],
    tag_slug: tag['wp:tag_slug'][0],
    tag_name: tag['wp:tag_name'][0],
  }));
  await writeJSON(tags, path.join(outputDir, 'tags.json'));

  // Process items
  for (const item of channel.item) {
    const postType = item['wp:post_type'][0];
    const postId = item['wp:post_id'][0];
    const postSlug = item['wp:post_name'][0];

    if (postType === 'attachment') {
      const attachment = {
        title: item.title[0],
        link: item.link[0],
        pubDate: item.pubDate[0],
        creator: item['dc:creator'][0],
        guid: item.guid[0]._,
        description: item.description[0],
        content: item['content:encoded'][0],
        excerpt: item['excerpt:encoded'][0],
        post_id: postId,
        post_date: item['wp:post_date'][0],
        post_date_gmt: item['wp:post_date_gmt'][0],
        post_name: item['wp:post_name'][0],
        status: item['wp:status'][0],
        post_parent: item['wp:post_parent'][0],
        menu_order: item['wp:menu_order'][0],
        post_type: postType,
        attachment_url: item['wp:attachment_url'][0],
        postmeta: unserializePostMeta(item['wp:postmeta'].map(meta => ({
          key: meta['wp:meta_key'][0],
          value: meta['wp:meta_value'][0],
        }))),
      };
      await writeJSON(attachment, path.join(outputDir, `attachment_${postId}.json`));
    } else if (postType === 'post' || postType === 'page') {
      let content = item['content:encoded'][0];
      const postDir = path.join(outputDir, 'posts', postSlug);
      await fs.mkdir(postDir, { recursive: true });

      content = await processContent(content, outputDir, postSlug);

      const frontmatter = {
        title: item.title[0],
        date: item['wp:post_date'][0],
        author: item['dc:creator'][0],
        categories: item.category ? item.category.map(cat => cat.$.nicename) : [],
        tags: item['wp:tag'] ? item['wp:tag'].map(tag => tag['wp:tag_slug'][0]) : [],
        status: item['wp:status'][0],
      };

      await writeMarkdown(content, frontmatter, path.join(postDir, 'index.md'));
    } else {
      const customPost = {
        title: item.title[0],
        link: item.link[0],
        pubDate: item.pubDate[0],
        creator: item['dc:creator'][0],
        guid: item.guid[0]._,
        description: item.description[0],
        content: item['content:encoded'][0],
        excerpt: item['excerpt:encoded'][0],
        post_id: postId,
        post_date: item['wp:post_date'][0],
        post_date_gmt: item['wp:post_date_gmt'][0],
        comment_status: item['wp:comment_status'][0],
        ping_status: item['wp:ping_status'][0],
        post_name: item['wp:post_name'][0],
        status: item['wp:status'][0],
        post_parent: item['wp:post_parent'][0],
        menu_order: item['wp:menu_order'][0],
        post_type: postType,
        postmeta: unserializePostMeta(item['wp:postmeta'].map(meta => ({
          key: meta['wp:meta_key'][0],
          value: meta['wp:meta_value'][0],
        }))),
      };
      await writeJSON(customPost, path.join(outputDir, `${postType}_${postId}.json`));
    }
  }
}

// Usage
migrateWPContent('wp_export.xml', 'output')
  .then(() => console.log('Migration completed'))
  .catch(console.error);