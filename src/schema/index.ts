import { defineArrayMember, defineField, defineType, SchemaTypeDefinition } from 'sanity';

// Needed to ensure the "code" field type is added for TS purposes
import { codeInput as _codeInput, codeSchema as _codeSchema } from '@sanity/code-input';

export const authorType = defineType({
  name: 'author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      type: 'string',
    }),
    defineField({
      name: 'avatar',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['palette', 'exif', 'location'],
      },
      fields: [
        { name: 'alt', type: 'string' },
      ],
    }),
  ],
});

export const categoryType = defineType({
  name: 'category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
  ],
});

export const postType = defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {
        source: 'title',
      },
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
    }),
    defineField({
      name: 'excerpt',
      type: 'text',
    }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{ type: 'author' }],
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'category' }] }],
    }),
    defineField({
      name: 'postFormat',
      type: 'string',
      options: {
        list: ['standard', 'aside', 'chat', 'gallery', 'link', 'image', 'quote', 'status', 'video', 'audio'],
      },
      initialValue: 'standard',
    }),
    defineField({
      name: 'featuredImage',
      type: 'image',
      options: {
        hotspot: true,
        metadata: ['palette', 'exif', 'location'],
      },
      fields: [
        { name: 'alt', type: 'string' },
      ],
    }),
    defineField({
      name: 'linkUrl',
      type: 'url',
    }),
    defineField({
      name: 'content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'H1', value: 'h1' },
            { title: 'H2', value: 'h2' },
            { title: 'H3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
        },
        {
          type: 'object',
          name: 'separator',
          title: 'Separator',
          fields: [],
        },
        {
          type: 'image',
          options: {
            hotspot: true,
            metadata: ['palette', 'exif', 'location'],
          },
          fields: [
            { name: 'alt', type: 'string' },
            { name: 'caption', type: 'string' },
          ],
        },
        {
          type: 'object',
          name: 'embed',
          title: 'Embed',
          fields: [
            defineField({
              name: 'url',
              type: 'url',
            }),
            defineField({
              name: 'caption',
              type: 'text',
            }),
            defineField({
              name: 'code',
              type: 'text',
            }),
            defineField({
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
            }),
            defineField({
              name: 'provider',
              type: 'string',
            }),
            defineField({
              name: 'embedType',
              type: 'string',
              options: {
                list: ['image', 'video', 'html'],
              },
            }),
          ],
        },
        defineArrayMember({
          type: 'object',
          name: 'gallery',
          title: 'Gallery',
          fields: [
            defineField({
              name: 'caption',
              type: 'text',
            }),
            defineField({
              name: 'layout',
              type: 'string',
              options: {
                list: ['flex', 'grid'],
              },
            }),
            defineField({
              name: 'columns',
              type: 'number',
            }),
            defineField({
              name: 'images',
              type: 'array',
              of: [{
                type: 'image',
                options: {
                  hotspot: true,
                },
                fields: [
                  { name: 'alt', type: 'string' },
                  { name: 'caption', type: 'string' },
                ],
              },
            ],
            }),
          ],
        }),
        defineArrayMember({
          type: 'code',
          name: 'codeBlock',
          title: 'Code Block',
          options: {
            withFilename: true,
            languageAlternatives: [
              { title: 'Javascript', value: 'javascript' },
              { title: 'HTML', value: 'html' },
              { title: 'Markup', value: 'markup', mode: 'html' },
              { title: 'CSS', value: 'css' },
              { title: 'PHP', value: 'php' },
              { title: 'SQL', value: 'sql' },
              { title: 'Ruby', value: 'ruby' },
              { title: 'Python', value: 'python' },
            ],
          },
        }),
      ],
    }),
  ],
});

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    postType,
    authorType,
    categoryType,
    _codeSchema,
  ],
}
