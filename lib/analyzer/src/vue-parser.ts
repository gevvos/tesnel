import { parse as parseSFC } from '@vue/compiler-sfc';
import { readFileSync } from 'fs';
import { parseSource, type TesnelFileParseResult } from './parser';

const getFileNameFromPath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};

export const parseVueFile = (path: string): TesnelFileParseResult => {
  const fileName = getFileNameFromPath(path);
  const source = readFileSync(path, 'utf8');
  const { descriptor, errors } = parseSFC(source, { filename: path });

  if (errors.length > 0) {
    return {
      name: fileName,
      imports: [],
      reExports: [],
      errors: errors.map(e => e.message),
    };
  }

  const script = descriptor.scriptSetup || descriptor.script;
  if (!script) {
    return { name: fileName, imports: [], reExports: [], errors: [] };
  }

  const lang = script.lang || 'js';
  const syntheticFileName = `${fileName}.${lang}`;

  const result = parseSource(syntheticFileName, script.content);
  result.name = fileName;
  return result;
};
