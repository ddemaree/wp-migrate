import { parseString } from 'xml2js';
import fs from 'fs/promises';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

export async function parseXML(filePath: string): Promise<any> {
  const xmlData = await fs.readFile(filePath, 'utf-8');
  return new Promise((resolve, reject) => {
    parseString(xmlData, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

export async function writeJSON(data: any, fileName: string): Promise<void> {
  await fs.writeFile(fileName, JSON.stringify(data, null, 2), { flag: "w" });
}

export async function mkdir_p(path: string): Promise<void> {
  await fs.mkdir(path, { recursive: true });
}

const LOCAL_DOMAIN = 'demaree.me';
const LOCAL_CONTENT_PATH = '/wp-content/';

export function isLocalUrl(url: string): boolean {
  const parsedUrl = new URL(url);
  return Boolean(parsedUrl.hostname === LOCAL_DOMAIN && parsedUrl.pathname?.startsWith(LOCAL_CONTENT_PATH));
}

export async function downloadFile(url: string, outputPath: string): Promise<void> {
  const { body } = await fetch(url);

  if (!body) {
    throw new Error('No response body');
  }

  fs.open(outputPath, "wx").then(async fd => {
    const fileStream = fd.createWriteStream();
    // @ts-ignore
    await finished(Readable.fromWeb(body).pipe(fileStream));
  });
}