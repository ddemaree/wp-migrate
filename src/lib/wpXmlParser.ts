import { parseXML } from './utils';
import { unserialize } from './php-unserialize';

export interface WpSiteData {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  language: string;
  base_site_url: string;
  base_blog_url: string;
}

export interface WpAuthor {
  _id: string;
  login: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
}

export interface WpTerm {
  _id: string;
  taxonomy: 'category' | 'tag' | 'unsplash_user' | 'media_tag';
  slug: string;
  name: string;
  parent?: string;
  meta?: Record<string, any>;
}

export interface WpItem {
  _id: string;
  _type: string;
  slug: string;
  title: string;
  date: string;
  modified: string;
  status: string;
  link: string;
  guid: string;
  guidIsPermalink: boolean;
  parent: string;
  meta: Record<string, any>[];
  content: string;
  excerpt: string;
  taxonomies: WpTerm[];
}

export interface WpAttachment extends WpItem {
  _type: 'attachment';
  attachmentUrl: string;
}

export interface WpPage extends WpItem {
  _type: 'page';
}

export interface WpPost extends WpItem {
  _type: 'post';
  format: 'standard' | 'aside' | 'chat' | 'gallery' | 'link' | 'image' | 'quote' | 'status' | 'video' | 'audio';
}

export interface WpNavMenuItem extends WpItem {
  _type: 'nav_menu_item';
  object: 'category' | 'post_type' | 'custom';
  object_id: string;
  target: string;
  classes: string[];
  xfn: string;
  nav_menu: string;
}

export interface WpExportData {
  categories: WpTerm[];
  tags: WpTerm[];
  authors: WpAuthor[];
  site: WpSiteData;
  attachments: WpAttachment[];
  posts: WpPost[];
  pages: WpPage[];
  menus: WpNavMenuItem[];
}

export class WpXmlParser {
  private data: WpExportData = {
    categories: [],
    tags: [],
    authors: [],
    site: {} as WpSiteData,
    attachments: [],
    posts: [],
    pages: [],
    menus: [],
  };

  async parse(xmlFilePath: string): Promise<WpExportData> {
    const xml = await parseXML(xmlFilePath);
    const channel = xml.rss.channel[0];

    this.parseSiteData(channel);
    this.parseAuthors(channel);
    this.parseCategories(channel);
    this.parseTags(channel);
    this.parseItems(channel);

    return this.data;
  }

  private parseSiteData(channel: any) {
    this.data.site = {
      title: channel.title[0],
      link: channel.link[0],
      description: channel.description[0],
      pubDate: channel.pubDate[0],
      language: channel.language[0],
      base_site_url: channel['wp:base_site_url'][0],
      base_blog_url: channel['wp:base_blog_url'][0],
    };
  }

  private parseAuthors(channel: any) {
    this.data.authors = channel['wp:author'].map((author: any) => ({
      _id: author['wp:author_id'][0],
      login: author['wp:author_login'][0],
      email: author['wp:author_email'][0],
      display_name: author['wp:author_display_name'][0],
      first_name: author['wp:author_first_name'][0],
      last_name: author['wp:author_last_name'][0],
    }));
  }

  private parseCategories(channel: any) {
    this.data.categories = channel['wp:category'].map((cat: any) => ({
      _id: cat['wp:term_id'][0],
      taxonomy: 'category',
      slug: cat['wp:category_nicename'][0],
      name: cat['wp:cat_name'][0],
      parent: cat['wp:category_parent'] ? cat['wp:category_parent'][0] : undefined,
    }));
  }

  private parseTags(channel: any) {
    this.data.tags = channel['wp:tag'].map((tag: any) => ({
      _id: tag['wp:term_id'][0],
      taxonomy: 'tag',
      slug: tag['wp:tag_slug'][0],
      name: tag['wp:tag_name'][0],
    }));
  }

  private parseItems(channel: any) {
    channel.item.forEach((item: any) => {
      const baseItem = this.parseBaseItem(item);
      switch (baseItem._type) {
        case 'attachment':
          this.data.attachments.push(this.parseAttachment(baseItem, item));
          break;
        case 'post':
          this.data.posts.push(this.parsePost(baseItem, item));
          break;
        case 'page':
          this.data.pages.push(baseItem as WpPage);
          break;
        case 'nav_menu_item':
          // this.data.menus.push(this.parseNavMenuItem(baseItem, item));
          break;
      }
    });
  }

  private parseBaseItem(item: any): WpItem {
    return {
      _id: item['wp:post_id'][0],
      _type: item['wp:post_type'][0],
      slug: item['wp:post_name'][0],
      title: item.title[0],
      date: item['wp:post_date_gmt'][0],
      modified: item['wp:post_modified_gmt'][0],
      status: item['wp:status'][0],
      link: item.link[0],
      guid: item.guid[0]._,
      guidIsPermalink: item.guid[0].$.isPermaLink === 'true',
      parent: item['wp:post_parent'][0],
      meta: this.parseMeta(item['wp:postmeta']),
      content: item['content:encoded'][0],
      excerpt: item['excerpt:encoded'][0],
      taxonomies: this.parseTaxonomies(item.category),
    };
  }

  private parseAttachment(baseItem: WpItem, item: any): WpAttachment {
    return {
      ...baseItem,
      _type: 'attachment',
      attachmentUrl: item['wp:attachment_url'][0],
    };
  }

  private parsePost(baseItem: WpItem, item: any): WpPost {
    let format: WpPost['format'] = 'standard';
    
    const postFormatCategory = item['category'].filter((c: any) => c.$.domain === 'post_format');
    if (postFormatCategory.length > 0) {
      format = postFormatCategory[0]._.toLowerCase() as WpPost['format'];
    }

    return {
      ...baseItem,
      _type: 'post',
      format,
    };
  }

  private parseNavMenuItem(baseItem: WpItem, item: any): WpNavMenuItem {
    return {
      ...baseItem,
      _type: 'nav_menu_item',
      object: item['wp:menu_item_object'][0],
      object_id: item['wp:menu_item_object_id'][0],
      target: item['wp:menu_item_target'][0],
      classes: item['wp:menu_item_classes'][0].split(' '),
      xfn: item['wp:menu_item_xfn'][0],
      nav_menu: item['wp:menu_item_menu_item_parent'][0],
    };
  }

  private parseMeta(metaItems: any[]): Record<string, any>[] {
    return (metaItems || []).map((meta: any) => {
      const key = meta['wp:meta_key'][0];
      let value = meta['wp:meta_value'][0];
      
      if (typeof value === 'string' && value.match(/^[aibsdn]:.+$/)) {
        value = unserialize(value);
      }

      return { key, value };
    });
  }

  private parseTaxonomies(categories: any[]): WpTerm[] {
    return (categories || []).map((category: any) => ({
      _id: category.$.nicename,
      taxonomy: category.$.domain,
      slug: category.$.nicename,
      name: category._,
    }));
  }
}
