# wp-migrate is a CLI that does exactly what it says on the tin.

## Well, kind of.

No CLI or tool can promise to do everything to migrate WordPress sites, which are complex beasts. Right now, this tool (which is a work in progress) can take an exported WordPress XML file and dump its contents as static Markdown and JSON files.

This includes:

- Parsing the XML into an in-memory representation of the WordPress site, which can be used to power export scripts beyond Markdown. (Next up: Sanity's NDJSON format.)
- Trying to convert Gutenberg blocks to their closest Markdown equivalents, or at least to simpler, more semantic HTML
- Removing the leading hostnames from the `src` attributes of the images so they can be relative

## I cannot stress enough how much this is still a work in progress

It works on my machine, but it needs work before it's ready for production use. Maybe you want to help?

## Install

```bash
npm install -g @ddemaree/wp-migrate
```

## Usage

```bash
wp-migrate migrate ./path/to/export.xml [./path/to/output-dir]
```

## Development

`wp-migrate` is built with [oclif](https://oclif.com/) and [tsx](https://github.com/microsoft/tsx), which is also to say it's written in TypeScript. When developing locally, use the `dev.js` script to run the CLI under `tsx`.

```bash
pnpm install
pnpm ./bin/dev.js
```

## License

This tool is free software, licensed under the MIT License. See the [LICENSE](./LICENSE.md) file for more details.

Copyright (c) 2024 Bits & Letters LLC.

Oh, and one more thing: WordPress is a registered trademark of the WordPress Foundation, under exclusive license to Automattic, Inc. This project is not affiliated with Matt Mullenweg, Automattic, or the WordPress Foundation. This project is brought to you by the letters W, P, F, and U.
