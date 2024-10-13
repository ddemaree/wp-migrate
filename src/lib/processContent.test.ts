import {describe, expect, test} from '@jest/globals';
import fs from 'fs/promises';
import { processGutenbergContent } from './processContent';

describe('processContent', () => {
  test('should process content', async () => {
    const content = await fs.readFile(__dirname + '/fixtures/basic-content.html', 'utf-8');
    const processed = processGutenbergContent(content, './output', 'basic-content');
    // expect(processed).toMatchSnapshot();
    // console.log(processed);


  });
});