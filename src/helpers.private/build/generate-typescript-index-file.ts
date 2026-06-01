import { glob } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';
import { normalize } from 'node:path/posix';
import { writeTextFileSafe } from '../file/write-text-file-safe.ts';
import { removeTrailingSlash } from '../path/remove-traling-slash.ts';

export interface GenerateTypescriptIndexFileOptions {
  readonly sourceDirectory: string;
  readonly type?: GenerateTypescriptIndexFileType;
  readonly cwd?: string;
}

export type GenerateTypescriptIndexFileType = 'public' | 'protected';

export async function generateTypescriptIndexFile({
  sourceDirectory,
  type = 'public',
  cwd = process.cwd(),
}: GenerateTypescriptIndexFileOptions): Promise<string | null> {
  sourceDirectory = removeTrailingSlash(sourceDirectory);

  let fileName: string;
  const pattern: string[] = [];
  const exclude: string[] = [];

  switch (type) {
    case 'public': {
      fileName = 'index.ts';
      pattern.push(`${sourceDirectory}/**/*.ts`);
      exclude.push(
        `${sourceDirectory}/**/*.{test,spec,bench,protected,private}.ts`,
        `${sourceDirectory}/**/*.{test,spec,bench,protected,private}/**/*.ts`,
      );
      break;
    }
    case 'protected': {
      fileName = 'index.protected.ts';
      pattern.push(
        `${sourceDirectory}/**/*protected.ts`,
        `${sourceDirectory}/**/*.protected/**/*.ts`,
      );
      exclude.push(
        `${sourceDirectory}/**/*.{test,spec,bench,private}.ts`,
        `${sourceDirectory}/**/*.{test,spec,bench,private}/**/*.ts`,
      );
      break;
    }
    default:
      throw new Error(`Unknown type ${type}.`);
  }

  let content: string = '';

  for await (const entry of glob(pattern, {
    exclude,
    cwd,
  })) {
    content += `export * from './${normalize(relative(sourceDirectory, entry))}';\n`;
  }

  if (content === '') {
    return null;
  }

  const outputPath: string = resolve(cwd, join(sourceDirectory, fileName));

  await writeTextFileSafe(outputPath, content);

  return outputPath;
}
