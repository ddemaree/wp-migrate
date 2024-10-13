import { staticExport } from './staticExport';
import { WpExportData } from './wpXmlParser';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

jest.mock('fs/promises');
jest.mock('path');
jest.mock('../../../lib/htmlToMarkdown', () => ({
  htmlToMarkdown: jest.fn().mockImplementation((html) => Promise.resolve(html)),
}));

describe('staticExport', () => {
  const mockData: WpExportData = {
    site: {
      title: 'Test Site',
      link: 'https://test.com',
      description: 'Test Description',
      pubDate: '2023-05-10',
      language: 'en-US',
      base_site_url: 'https://test.com',
      base_blog_url: 'https://test.com',
    },
    authors: [{ _id: '1', login: 'testuser', email: 'test@test.com', display_name: 'Test User', first_name: 'Test', last_name: 'User' }],
    categories: [{ _id: '1', taxonomy: 'category', slug: 'test-category', name: 'Test Category' }],
    tags: [{ _id: '2', taxonomy: 'tag', slug: 'test-tag', name: 'Test Tag' }],
    attachments: [{ _id: '3', _type: 'attachment', slug: 'test-attachment', title: 'Test Attachment', date: '2023-05-10', modified: '2023-05-10', status: 'inherit', link: 'https://test.com/test-attachment', guid: 'https://test.com/?p=3', guidIsPermalink: false, parent: '0', meta: [], content: '', excerpt: '', taxonomies: [], attachmentUrl: 'https://test.com/wp-content/uploads/test-attachment.jpg' }],
    posts: [{ _id: '4', _type: 'post', slug: 'test-post', title: 'Test Post', date: '2023-05-10', modified: '2023-05-10', status: 'publish', link: 'https://test.com/test-post', guid: 'https://test.com/?p=4', guidIsPermalink: false, parent: '0', meta: [], content: '<p>Test content</p>', excerpt: 'Test excerpt', taxonomies: [], format: 'standard' }],
    pages: [{ _id: '5', _type: 'page', slug: 'test-page', title: 'Test Page', date: '2023-05-10', modified: '2023-05-10', status: 'publish', link: 'https://test.com/test-page', guid: 'https://test.com/?p=5', guidIsPermalink: false, parent: '0', meta: [], content: '<p>Test page content</p>', excerpt: 'Test page excerpt', taxonomies: [] }],
    menus: [{ _id: '6', _type: 'nav_menu_item', slug: 'test-menu-item', title: 'Test Menu Item', date: '2023-05-10', modified: '2023-05-10', status: 'publish', link: 'https://test.com/test-menu-item', guid: 'https://test.com/?p=6', guidIsPermalink: false, parent: '0', meta: [], content: '', excerpt: '', taxonomies: [], object: 'custom', object_id: '0', target: '', classes: [], xfn: '', nav_menu: '0' }],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create directory structure', async () => {
    await staticExport(mockData, '/output');
    expect(mkdir).toHaveBeenCalledTimes(8);
  });

  it('should export site data', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/site/site.json'),
      expect.stringContaining('"title":"Test Site"')
    );
  });

  it('should export authors', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/authors.json'),
      expect.stringContaining('"login":"testuser"')
    );
  });

  it('should export taxonomies', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/taxonomies/categories.json'),
      expect.stringContaining('"name":"Test Category"')
    );
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/taxonomies/tags.json'),
      expect.stringContaining('"name":"Test Tag"')
    );
  });

  it('should export attachments', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/attachments/test-attachment.json'),
      expect.stringContaining('"title":"Test Attachment"')
    );
  });

  it('should export posts', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/posts/test-post.md'),
      expect.stringContaining('"title":"Test Post"')
    );
  });

  it('should export pages', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/pages/test-page.md'),
      expect.stringContaining('"title":"Test Page"')
    );
  });

  it('should export menus', async () => {
    await staticExport(mockData, '/output');
    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('content/data/menus.json'),
      expect.stringContaining('"title":"Test Menu Item"')
    );
  });
});
