import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = fs.readFileSync(path.join(root, 'js/library.js'), 'utf8');
const context = {};
vm.runInNewContext(source, context, { filename: 'js/library.js' });
const original = context.DEFAULT_LIBRARY;
if (!Array.isArray(original) || original.length === 0) throw new Error('基础词库不可用');

const existing = new Set(original.map(({ category, base }) => `${category}\0${base}`));
const expanded = [];
const lines = fs.readFileSync(path.join(root, 'data/word-families.tsv'), 'utf8').split(/\r?\n/);
for (const [index, raw] of lines.entries()) {
  if (!raw || raw.startsWith('#')) continue;
  const fields = raw.split('\t');
  if (fields.length !== 2) throw new Error(`第 ${index + 1} 行应包含类别和词语`);
  const [category, wordList] = fields;
  const words = wordList.split(',').map(word => word.trim());
  if (!category || words.length < 5 || words.some(word => !word || word.length > 100) || new Set(words).size !== words.length) {
    throw new Error(`第 ${index + 1} 行存在空词、重复词或词语不足`);
  }
  for (let i = 0; i < words.length; i++) {
    const base = words[i];
    const key = `${category}\0${base}`;
    if (existing.has(key)) continue;
    const variants = [-2, -1, 1, 2].map(offset => words[(i + offset + words.length) % words.length]);
    if (new Set(variants).size !== 4 || variants.includes(base)) throw new Error(`第 ${index + 1} 行无法生成有效词对`);
    expanded.push({ base, variants, category });
    existing.add(key);
  }
}

const jsLines = [
  '// 由 tools/build-word-expansion.mjs 从 data/word-families.tsv 生成，请勿手改。',
  'var LEGACY_DEFAULT_LIBRARY = DEFAULT_LIBRARY.slice();',
  'var EXPANDED_LIBRARY = [',
  ...expanded.map(group => `  ${JSON.stringify(group)},`),
  '];',
  'DEFAULT_LIBRARY.push(...EXPANDED_LIBRARY);',
  '',
];
fs.writeFileSync(path.join(root, 'js/library-expanded.js'), jsLines.join('\n'));
const seedPath = path.resolve(root, '../mozheAdmin/database/seeds/undercover_words_expanded.json');
fs.writeFileSync(seedPath, `${JSON.stringify(expanded, null, 2)}\n`);

const categories = new Set([...original, ...expanded].map(({ category }) => category));
const words = new Set([...original, ...expanded].flatMap(({ base, variants }) => [base, ...variants]));
console.log(JSON.stringify({ original: original.length, expanded: expanded.length, total: original.length + expanded.length, categories: categories.size, uniqueWords: words.size }));
