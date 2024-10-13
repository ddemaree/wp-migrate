import {describe, expect, test} from '@jest/globals';
import fs from 'fs/promises';
import { htmlToSanityBlocks } from './htmlToSanityBlocks';

describe('htmlToSanityBlocks', () => {
  test('should process content', async () => {
    const content = await fs.readFile(__dirname + '/fixtures/basic-content.html', 'utf-8');
    const processed = htmlToSanityBlocks(content, 'basic-content');
    // console.dir(processed, {depth: Infinity});
    // expect(processed).toMatchSnapshot();
  });
});