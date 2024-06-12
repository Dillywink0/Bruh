const fs = require('fs').promises;
const sharp = require('sharp');
const Color = require('color');
const { Command } = require('commander');

const TEMP_RESULT_PATH = 'temp.png';

async function pngToBruh(filePath) {
  try {
    const image = sharp(filePath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    let resultStr = '';
    let lastLine = 0;

    for (let i = 0; i < data.length; i += 3) {
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      const hexColor = Color({ r, g, b }).hex().slice(1); // Remove the '#' character

      const currentLine = Math.floor(i / 3 / info.width);
      if (lastLine !== currentLine) {
        resultStr += '\n';
        lastLine = currentLine;
      }
      resultStr += hexColor;
    }

    const height = info.height;
    const width = info.width;

    const heightBytes = Buffer.alloc(4);
    const widthBytes = Buffer.alloc(4);
    heightBytes.writeUInt32LE(height);
    widthBytes.writeUInt32LE(width);

    const bruhFilePath = filePath.replace('.png', '.bruh');
    await fs.writeFile(bruhFilePath, Buffer.concat([widthBytes, heightBytes, Buffer.from(resultStr)]));

    console.log('Successfully converted PNG to BRUH');
  } catch (error) {
    console.error('Failed to convert PNG to BRUH:', error);
  }
}

async function bruhToPng(filePath) {
  try {
    const contents = await fs.readFile(filePath);
    const width = contents.readUInt32LE(0);
    const height = contents.readUInt32LE(4);
    const sanitizedContent = contents.slice(8).toString('utf8').replace(/\n/g, '');

    const pixels = sanitizedContent.match(/.{1,6}/g).map(hex => {
      const color = Color(`#${hex}`);
      return [color.red(), color.green(), color.blue(), 255]; // Add alpha channel
    });

    const imageData = Buffer.concat(pixels.map(pixel => Buffer.from(pixel)));
    await sharp(imageData, { raw: { width, height, channels: 4 } }).png().toFile(TEMP_RESULT_PATH);

    console.log(`Converted BRUH to PNG with dimensions: ${width}x${height}`);
  } catch (error) {
    console.error('Failed to convert BRUH to PNG:', error);
  }
}

async function main() {
  const program = new Command();
  program
    .name('bruh-converter')
    .description('Convert PNG to BRUH format and vice versa')
    .version('1.0.0');

  program
    .command('compile <path>')
    .description('Convert PNG to BRUH format')
    .action(async (path) => {
      if (!await fileExists(path)) {
        console.error(`File not found: ${path}`);
        process.exit(1);
      }
      await pngToBruh(path);
    });

  program
    .command('preview <path>')
    .description('Convert BRUH to PNG format')
    .action(async (path) => {
      if (!await fileExists(path)) {
        console.error(`File not found: ${path}`);
        process.exit(1);
      }
      await bruhToPng(path);
    });

  program.parse(process.argv);
}

async function fileExists(path) {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

main().catch(console.error);
