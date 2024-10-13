import { WpExportData, WpPost, WpPage, WpAttachment, WpSiteData, WpAuthor, WpTerm, WpNavMenuItem } from './wpXmlParser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { htmlToMarkdown } from './htmlToMarkdown';
import grayMatter from 'gray-matter';
import { mkdir_p } from './utils';

export async function staticExport(data: WpExportData, outputDir: string) {
  await createDirectoryStructure(outputDir);
  await exportSiteData(data.site, outputDir);
  await exportAuthors(data.authors, outputDir);
  await exportTaxonomies(data.categories, data.tags, outputDir);
  await exportAttachments(data.attachments, outputDir);
  await exportPosts(data.posts, outputDir, data);
  await exportPages(data.pages, outputDir);
  await exportMenus(data.menus, outputDir);
}

async function createDirectoryStructure(outputDir: string) {
  const dirs = [
    'content/posts',
    'content/pages',
    'content/data',
    'content/uploads',
    'content/data/taxonomies',
    'content/data/attachments',
    'content/data/site',
    'content/data/posts_meta',
  ];
  
  for (const dir of dirs) {
    await mkdir(path.join(outputDir, dir), { recursive: true });
  }
}

async function exportSiteData(site: WpSiteData, outputDir: string) {
  await writeFile(
    path.join(outputDir, 'content/data/site/site.json'),
    JSON.stringify(site, null, 2)
  );
}

async function exportAuthors(authors: WpAuthor[], outputDir: string) {
  await writeFile(
    path.join(outputDir, 'content/data/authors.json'),
    JSON.stringify(authors, null, 2)
  );
}

async function exportTaxonomies(categories: WpTerm[], tags: WpTerm[], outputDir: string) {
  await writeFile(
    path.join(outputDir, 'content/data/taxonomies/categories.json'),
    JSON.stringify(categories, null, 2)
  );
  await writeFile(
    path.join(outputDir, 'content/data/taxonomies/tags.json'),
    JSON.stringify(tags, null, 2)
  );
}

async function exportAttachments(attachments: WpAttachment[], outputDir: string) {
  for (const attachment of attachments) {
    await writeFile(
      path.join(outputDir, `content/data/attachments/${attachment.slug}.json`),
      JSON.stringify(attachment, null, 2)
    );
  }
}

async function exportPosts(posts: WpPost[], outputDir: string, exportSiteData: WpExportData) {
  for (const post of posts) {
    const { content, frontmatter } = await processPostContent(post, exportSiteData);
    const filename = post.status === 'draft' ? `DRAFT-${post.slug || `post-${post._id}`}.md` : `${post.slug}.md`;
    
    await mkdir_p(path.join(outputDir, `content/posts/${post.format}`));

    await writeFile(
      path.join(outputDir, `content/posts/${post.format}/${filename}`),
      grayMatter.stringify({content}, frontmatter)
    );

    // Export post meta
    const metaToExport = post.meta.filter(m => !m.key.startsWith('_'));
    if (metaToExport.length > 0) {
      await writeFile(
        path.join(outputDir, `content/data/posts_meta/${post.slug}.json`),
        JSON.stringify(metaToExport, null, 2)
      );
    }
  }
}

async function exportPages(pages: WpPage[], outputDir: string) {
  // Similar to exportPosts, but for pages
}

async function exportMenus(menus: WpNavMenuItem[], outputDir: string) {
  await writeFile(
    path.join(outputDir, 'content/data/menus.json'),
    JSON.stringify(menus, null, 2)
  );
}

type Frontmatter = {
  title: string;
  date: string;
  modified: string;
  slug: string;
  status: string;
  urls: { link: string; guid: string; other?: string[] };
  draft?: boolean;
  link_url?: string;
  subtitle?: string;
  post_format?: string;
  categories?: string[];
  tags?: string[];
}

async function processPostContent(post: WpPost | WpPage, exportSiteData: WpExportData): Promise<{ content: string, frontmatter: Frontmatter }> {
  const markdown = await htmlToMarkdown(post.content, post.slug, exportSiteData);

  const frontmatter: Frontmatter = {
    title: post.title,
    date: post.date,
    modified: post.modified,
    slug: post.slug,
    status: post.status,
    urls: {
      link: post.link,
      guid: post.guid,
    },
    categories: post.taxonomies.filter(t => t.taxonomy === 'category').map(c => c.name),
    tags: post.taxonomies.filter(t => t.taxonomy === 'tag').map(t => t.name),
  };

  if(post._type === 'post') {
    const postFormat = post.format;
    frontmatter.post_format = postFormat;
  }

  if (post.status === 'draft') {
    frontmatter.draft = true;
  }

  // Add link_url and subtitle if they exist
  const linkUrl = post.meta.find(m => m.key === 'link_url')?.value;
  const subtitle = post.meta.find(m => m.key === 'subtitle')?.value;
  if (linkUrl) frontmatter.link_url = linkUrl;
  if (subtitle) frontmatter.subtitle = subtitle;

  return { content: markdown, frontmatter };
}
