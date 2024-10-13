import { Command, Args } from '@oclif/core';
import { WpXmlParser } from '../../lib/wpXmlParser';
import { staticExport } from '../../lib/staticExport';

export default class Migrate extends Command {
  static description = 'Migrate WordPress XML export to static files';

  static args = {
    input: Args.string({
      description: 'Input XML file',
      required: true,
      default: 'wordpress.xml',
    }),
    output: Args.string({
      description: 'Output directory',
      required: true,
      default: 'output',
    }),
  };
  
  async run() {
    const { args } = await this.parse(Migrate);

    const parser = new WpXmlParser();
    const data = await parser.parse(args.input);

    await staticExport(data, args.output);

    this.log('Migration completed successfully');
  }
}