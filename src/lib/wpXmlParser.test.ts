import { WpXmlParser } from './wpXmlParser';
import { parseXML } from './utils';
import { unserialize } from './php-unserialize';

// Mock the dependencies
jest.mock('./utils');
jest.mock('./php-unserialize');

describe('WpXmlParser', () => {
  let parser: WpXmlParser;
  let mockXml: any;

  beforeEach(() => {
    parser = new WpXmlParser();
    mockXml = {
      rss: {
        channel: [{
          title: ['Test Blog'],
          link: ['https://testblog.com'],
          description: ['A test blog'],
          pubDate: ['Mon, 06 Sep 2021 12:00:00 +0000'],
          language: ['en-US'],
          'wp:base_site_url': ['https://testblog.com'],
          'wp:base_blog_url': ['https://testblog.com'],
          'wp:author': [{
            'wp:author_id': ['1'],
            'wp:author_login': ['testuser'],
            'wp:author_email': ['test@example.com'],
            'wp:author_display_name': ['Test User'],
            'wp:author_first_name': ['Test'],
            'wp:author_last_name': ['User'],
          }],
          'wp:category': [{
            'wp:term_id': ['1'],
            'wp:category_nicename': ['uncategorized'],
            'wp:cat_name': ['Uncategorized'],
          }],
          'wp:tag': [{
            'wp:term_id': ['2'],
            'wp:tag_slug': ['test-tag'],
            'wp:tag_name': ['Test Tag'],
          }],
          item: [
            {
              'wp:post_id': ['1'],
              'wp:post_type': ['post'],
              'wp:post_name': ['hello-world'],
              title: ['Hello World'],
              'wp:post_date_gmt': ['2021-09-06 12:00:00'],
              'wp:post_modified_gmt': ['2021-09-06 12:00:00'],
              'wp:status': ['publish'],
              link: ['https://testblog.com/hello-world'],
              guid: [{ _: 'https://testblog.com/?p=1', $: { isPermaLink: 'false' } }],
              'wp:post_parent': ['0'],
              'wp:postmeta': [{ 'wp:meta_key': ['_edit_last'], 'wp:meta_value': ['1'] }],
              'content:encoded': ['<p>Hello World content</p>'],
              'excerpt:encoded': ['Hello World excerpt'],
              category: [{ _: 'Uncategorized', $: { domain: 'category', nicename: 'uncategorized' } }],
            },
          ],
        }],
      },
    };
    (parseXML as jest.Mock).mockResolvedValue(mockXml);
  });

  test('parse method should return WpExportData', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result).toHaveProperty('site');
    expect(result).toHaveProperty('authors');
    expect(result).toHaveProperty('categories');
    expect(result).toHaveProperty('tags');
    expect(result).toHaveProperty('posts');
    expect(result).toHaveProperty('pages');
    expect(result).toHaveProperty('attachments');
    expect(result).toHaveProperty('menus');
  });

  test('should parse site data correctly', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result.site).toEqual({
      title: 'Test Blog',
      link: 'https://testblog.com',
      description: 'A test blog',
      pubDate: 'Mon, 06 Sep 2021 12:00:00 +0000',
      language: 'en-US',
      base_site_url: 'https://testblog.com',
      base_blog_url: 'https://testblog.com',
    });
  });

  test('should parse authors correctly', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result.authors).toHaveLength(1);
    expect(result.authors[0]).toEqual({
      _id: '1',
      login: 'testuser',
      email: 'test@example.com',
      display_name: 'Test User',
      first_name: 'Test',
      last_name: 'User',
    });
  });

  test('should parse categories correctly', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toEqual({
      _id: '1',
      taxonomy: 'category',
      slug: 'uncategorized',
      name: 'Uncategorized',
    });
  });

  test('should parse tags correctly', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result.tags).toHaveLength(1);
    expect(result.tags[0]).toEqual({
      _id: '2',
      taxonomy: 'tag',
      slug: 'test-tag',
      name: 'Test Tag',
    });
  });

  test('should parse posts correctly', async () => {
    const result = await parser.parse('dummy.xml');

    expect(result.posts).toHaveLength(1);
    expect(result.posts[0]).toMatchObject({
      _id: '1',
      _type: 'post',
      slug: 'hello-world',
      title: 'Hello World',
      date: '2021-09-06 12:00:00',
      modified: '2021-09-06 12:00:00',
      status: 'publish',
      link: 'https://testblog.com/hello-world',
      guid: 'https://testblog.com/?p=1',
      guidIsPermalink: false,
      parent: '0',
      content: '<p>Hello World content</p>',
      excerpt: 'Hello World excerpt',
    });
  });

  test('should parse post meta correctly', async () => {
    const result = await parser.parse('dummy.xml');
    
    if(!result.posts[0]) {
      throw new Error('No posts found');
    }

    expect(result.posts[0].meta).toHaveLength(1);
    expect(result.posts[0].meta[0]).toEqual({
      key: '_edit_last',
      value: '1',
    });
  });

  test('should parse post taxonomies correctly', async () => {
    const result = await parser.parse('dummy.xml');

    if(!result.posts[0]) {
      throw new Error('No posts found');
    }

    expect(result.posts[0].taxonomies).toHaveLength(1);
    expect(result.posts[0].taxonomies[0]).toEqual({
      _id: 'uncategorized',
      taxonomy: 'category',
      slug: 'uncategorized',
      name: 'Uncategorized',
    });
  });
});
