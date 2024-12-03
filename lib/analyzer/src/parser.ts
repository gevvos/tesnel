import { parseSync } from 'oxc-parser';
import type { ParseResult } from 'oxc-parser';
import { readFileSync } from 'fs';

type TesnelFileDependency = {
  from: string;
}

type TesnelFileParseResult = {
  name: string;
  lang: string;
  dependencies: TesnelFileDependency[];
}

const getFileNameFromPath = (path: string) => {
  const parts = path.split('/');
  return parts[parts.length - 1];
}

const mapAstToResult = (ast: ParseResult, name: string): TesnelFileParseResult => {
  const { sourceType, body } = ast.program;


  const lang = sourceType.language;

  const dependencies = body.reduce((acc: TesnelFileDependency[], val) => {
    if (val.type === 'ImportDeclaration') {
      const { source } = val;
      const { value } = source;
      acc.push({ from: value });
    }
    return acc;
  }, []);

  return {
    name,
    lang,
    dependencies
  }
}

export const parseFile = (path: string): TesnelFileParseResult => {
  const fileName = getFileNameFromPath(path);
  const options = { sourceFilename: fileName };

  const sourceText = readFileSync(path, 'utf8');
  const ast = parseSync(sourceText, options);

  return mapAstToResult(ast, fileName);
}