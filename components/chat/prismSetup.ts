import Prism from 'prismjs/components/prism-core';

(globalThis as typeof globalThis & { Prism: typeof Prism }).Prism = Prism;

Prism.manual = true;

/* eslint-disable @typescript-eslint/no-require-imports */
require('prismjs/components/prism-markup');
require('prismjs/components/prism-clike');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-tsx');
require('prismjs/components/prism-json');
require('prismjs/components/prism-css');
require('prismjs/components/prism-python');
require('prismjs/components/prism-ruby');
require('prismjs/components/prism-rust');
require('prismjs/components/prism-c');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-java');
require('prismjs/components/prism-go');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-yaml');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-kotlin');
require('prismjs/components/prism-swift');
require('prismjs/components/prism-diff');
/* eslint-enable @typescript-eslint/no-require-imports */

export default Prism;
