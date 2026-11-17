export type TokenKind = 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'type' | 'tag' | 'attr' | 'variable';

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
}

type Family = 'c' | 'hash' | 'sql' | 'markup' | 'json' | 'css';

interface Grammar {
  readonly family: Family;
  readonly keywords: ReadonlySet<string>;
  readonly caseInsensitive?: boolean;
}

const MAX_CODE_LENGTH = 200_000;

const words = (list: string): ReadonlySet<string> => new Set(list.split(' '));

const C_COMMON = 'if else for while do switch case default break continue return new try catch finally throw class interface enum struct public private protected static readonly const void null true false this using import export from as in is var let function async await yield extends implements override virtual abstract sealed typeof instanceof delete get set';
const CSHARP = words(`${C_COMMON} namespace string int long bool double decimal float char byte object dynamic base out ref params where select foreach lock internal partial record init required nameof sizeof checked unchecked event operator implicit explicit fixed unsafe goto stackalloc`);
const TS = words(`${C_COMMON} type keyof declare module namespace any unknown never string number boolean symbol bigint undefined of satisfies constructor super package`);
const JAVA = words(`${C_COMMON} package final native synchronized transient volatile throws super int long boolean double float char byte short assert`);
const KOTLIN = words(`${C_COMMON} fun val package object data sealed open lateinit companion when init super Int String Boolean Unit`);
const SWIFT = words(`${C_COMMON} func let guard defer struct extension protocol self Self init deinit inout some any where`);
const DART = words(`${C_COMMON} final late required dynamic super library part show hide factory mixin with on covariant int double String bool Future Stream Widget`);
const XPP = words(`${C_COMMON} str int real boolean date utcdatetime container display edit server client select firstonly forupdate crosscompany join exists notexists outer order by group index hint ttsbegin ttscommit ttsabort next element super final changecompany print info warning error`);
const PHP = words(`${C_COMMON} echo foreach as array function require include require_once include_once global elseif endif endforeach`);
const SHELL = words('if then else elif fi for while do done case esac in function return export local readonly sudo echo cd source exit set unset alias');
const POWERSHELL = words('if else elseif foreach for while do switch function param return try catch finally throw begin process end exit in');
const PYTHON = words('if elif else for while in def return class import from as try except finally raise with lambda yield pass break continue and or not is None True False async await global nonlocal');
const YAML = words('true false null yes no on off');
const DOCKER = words('FROM RUN CMD ENTRYPOINT COPY ADD WORKDIR ENV EXPOSE ARG VOLUME USER LABEL HEALTHCHECK SHELL AS');
const SQL = words('select from where and or not insert into values update set delete create alter drop table view procedure function begin end declare as on join inner left right outer full cross group by order having union all distinct top limit offset case when then else is null exists in like between primary key foreign references index go exec execute return if while print with nolock int varchar nvarchar datetime bit decimal');
const JSON_WORDS = words('true false null');
const NONE = words('');

const GRAMMARS: Readonly<Record<string, Grammar>> = {
  csharp: { family: 'c', keywords: CSHARP },
  cs: { family: 'c', keywords: CSHARP },
  ts: { family: 'c', keywords: TS },
  typescript: { family: 'c', keywords: TS },
  tsx: { family: 'c', keywords: TS },
  js: { family: 'c', keywords: TS },
  javascript: { family: 'c', keywords: TS },
  jsx: { family: 'c', keywords: TS },
  java: { family: 'c', keywords: JAVA },
  kotlin: { family: 'c', keywords: KOTLIN },
  swift: { family: 'c', keywords: SWIFT },
  dart: { family: 'c', keywords: DART },
  xpp: { family: 'c', keywords: XPP },
  php: { family: 'c', keywords: PHP },
  bash: { family: 'hash', keywords: SHELL },
  sh: { family: 'hash', keywords: SHELL },
  shell: { family: 'hash', keywords: SHELL },
  zsh: { family: 'hash', keywords: SHELL },
  cmd: { family: 'hash', keywords: SHELL },
  powershell: { family: 'hash', keywords: POWERSHELL, caseInsensitive: true },
  ps1: { family: 'hash', keywords: POWERSHELL, caseInsensitive: true },
  python: { family: 'hash', keywords: PYTHON },
  yaml: { family: 'hash', keywords: YAML },
  yml: { family: 'hash', keywords: YAML },
  dockerfile: { family: 'hash', keywords: DOCKER },
  ini: { family: 'hash', keywords: NONE },
  toml: { family: 'hash', keywords: YAML },
  sql: { family: 'sql', keywords: SQL, caseInsensitive: true },
  tsql: { family: 'sql', keywords: SQL, caseInsensitive: true },
  xml: { family: 'markup', keywords: NONE },
  html: { family: 'markup', keywords: NONE },
  xaml: { family: 'markup', keywords: NONE },
  razor: { family: 'markup', keywords: NONE },
  cshtml: { family: 'markup', keywords: NONE },
  svg: { family: 'markup', keywords: NONE },
  json: { family: 'json', keywords: JSON_WORDS },
  jsonc: { family: 'json', keywords: JSON_WORDS },
  css: { family: 'css', keywords: NONE },
  scss: { family: 'css', keywords: NONE },
};

type Pattern = readonly [TokenKind | 'word', RegExp];

const PATTERNS: Readonly<Record<Family, readonly Pattern[]>> = {
  c: [
    ['comment', /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /@"(?:[^"]|"")*"|\$?"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`/y],
    ['number', /\b(?:0x[\da-fA-F]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?)[mMfFdDlLuU]?\b/y],
    ['attr', /@[A-Za-z_]\w*|\[[A-Z]\w*(?=[\](])/y],
    ['word', /[A-Za-z_$][\w$]*/y],
  ],
  hash: [
    ['comment', /(?:^|(?<=\s))(?:#|REM\b|::)[^\n]*/my],
    ['string', /"(?:\\.|[^"\\])*"|'[^'\n]*'/y],
    ['variable', /\$\{[^}\n]*\}|\$\(?[A-Za-z_][\w:]*|%[A-Za-z_]\w*%/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['attr', /(?<=^|\s)--?[A-Za-z][\w-]*|^[ \t]*[\w.-]+(?=\s*[:=])/my],
    ['word', /[A-Za-z_][\w-]*/y],
  ],
  sql: [
    ['comment', /--[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /N?'(?:''|[^'])*'/y],
    ['variable', /@@?\w+/y],
    ['number', /\b\d+(?:\.\d+)?\b/y],
    ['word', /[A-Za-z_][\w$#]*/y],
  ],
  markup: [
    ['comment', /<!--[\s\S]*?(?:-->|$)/y],
    ['tag', /<\/?[A-Za-z][\w:.-]*|\/?>/y],
    ['string', /"[^"]*"|'[^']*'/y],
    ['attr', /[A-Za-z_:@][\w:.-]*(?==)/y],
  ],
  json: [
    ['attr', /"(?:\\.|[^"\\])*"(?=\s*:)/y],
    ['string', /"(?:\\.|[^"\\])*"/y],
    ['comment', /\/\/[^\n]*/y],
    ['number', /-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/y],
    ['word', /[a-z]+/y],
  ],
  css: [
    ['comment', /\/\*[\s\S]*?(?:\*\/|$)/y],
    ['string', /"[^"\n]*"|'[^'\n]*'/y],
    ['attr', /--?[A-Za-z][\w-]*(?=\s*:)|[a-z-]+(?=\s*:[^:])/y],
    ['number', /-?\b\d+(?:\.\d+)?(?:px|rem|em|%|vh|vw|s|ms|deg|fr)?\b|#[\da-fA-F]{3,8}\b/y],
    ['keyword', /@[a-z-]+|!important/y],
  ],
};

export function grammarFor(lang: string): Grammar | null {
  return GRAMMARS[lang.toLowerCase()] ?? null;
}

export function highlight(code: string, lang: string): Token[] {
  const grammar = grammarFor(lang);
  if (!grammar || code.length > MAX_CODE_LENGTH) return [{ kind: 'plain', text: code }];
  const tokens: Token[] = [];
  const patterns = PATTERNS[grammar.family];
  let plain = '';
  let index = 0;
  const emit = (kind: TokenKind, text: string): void => {
    if (kind === 'plain') {
      plain += text;
      return;
    }
    if (plain) tokens.push({ kind: 'plain', text: plain });
    plain = '';
    tokens.push({ kind, text });
  };
  while (index < code.length) {
    const match = matchAt(patterns, code, index);
    if (!match) {
      emit('plain', code[index] ?? '');
      index += 1;
      continue;
    }
    emit(match.kind === 'word' ? classifyWord(match.text, grammar) : match.kind, match.text);
    index += match.text.length;
  }
  if (plain) tokens.push({ kind: 'plain', text: plain });
  return tokens;
}

interface Match {
  readonly kind: TokenKind | 'word';
  readonly text: string;
}

function matchAt(patterns: readonly Pattern[], code: string, index: number): Match | null {
  for (const [kind, pattern] of patterns) {
    pattern.lastIndex = index;
    const match = pattern.exec(code);
    if (match && match[0].length > 0) return { kind, text: match[0] };
  }
  return null;
}

function classifyWord(word: string, grammar: Grammar): TokenKind {
  const key = grammar.caseInsensitive ? word.toLowerCase() : word;
  if (grammar.keywords.has(key)) return 'keyword';
  if (grammar.family === 'c' && /^[A-Z][a-z0-9]\w*$/.test(word)) return 'type';
  return 'plain';
}
