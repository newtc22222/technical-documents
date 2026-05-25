# Setting up i18n (internationalization) in Docusaurus

## Step 0: Prepare a new Docusaurus project (if you don’t have one)

If you don’t have a project yet, quickly create a simple one.

```bash
npx create-docusaurus@latest my-site classic
cd my-site
npm install
```

Initial structure:

```txt
my-site/
├── docusaurus.config.js
├── docs/
│   └── intro.md  # Sample content: "Hello from Docusaurus"
├── src/
│   └── pages/
│       └── index.js
└── package.json
```

Run it: `npm run start` → Open <http://localhost:3000> to see the default site.

## Step 1: Enable i18n in config (Basic configuration demo)

Open `docusaurus.config.js` and add the i18n section. This is a full demo with 2 languages.

```js
// @ts-check
// `@type {import('@docusaurus/types').Config}`
const config = {
  title: 'My Site',
  tagline: 'Dinosaurs are cool',
  favicon: 'img/favicon.ico',
  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'your-org', // Usually your GitHub org/user name.
  projectName: 'my-site', // Usually your repo name.

  onBrokenLinks: 'throw',

  i18n: {  // <--- i18n demo here
    defaultLocale: 'vi',  // Vietnamese as default
    locales: ['vi', 'en'],  // Support vi and en
    localeConfigs: {
      vi: {
        label: 'Tiếng Việt',
        direction: 'ltr',  // Left-to-right
      },
      en: {
        label: 'English',
        direction: 'ltr',
      },
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
          },
          editUrl: 'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
          onInlineTags: 'warn',
          onInlineAuthors: 'warn',
          onUntruncatedBlogPosts: 'warn',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'My Site',
        logo: {
          alt: 'My Site Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Tutorial',
          },
          {to: '/blog', label: 'Blog', position: 'left'},
          {
            href: 'https://github.com/facebook/docusaurus',
            label: 'GitHub',
            position: 'right',
          },
          {
            type: 'localeDropdown',  // <--- Add language dropdown
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          // ... (keep unchanged)
        ],
        copyright: `Copyright © ${new Date().getFullYear()} My Project, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismReactRenderer.themes.github,
        darkTheme: prismReactRenderer.themes.dracula,
      },
    }),
};

export default config;
```

**Demo run:** `npm run start` → Now the site has a language dropdown, but there are no translations yet so en will fallback to vi.

## Step 2: Create the translation folder structure (Docs split demo)

Assuming the original docs (`docs/intro.md`) are in Vietnamese. We will copy them to en for translation.

**Sample original docs content (Vietnamese):**
Open `docs/intro.md` and write:

```md
---
sidebar_position: 1
---

# Giới thiệu

Xin chào! Đây là tài liệu mẫu bằng tiếng Việt.
```

**Demo commands to split into en:**

```bash
# Create the base translation JSON for en
npm run write-translations -- --locale en

# Copy Vietnamese docs into the en folder for translation
mkdir -p i18n/en/docusaurus-plugin-content-docs/current
cp -r docs/* i18n/en/docusaurus-plugin-content-docs/current/
```

**Demo translation for en:**
Open `i18n/en/docusaurus-plugin-content-docs/current/intro.md` and change it to:

```md
---
sidebar_position: 1
---

# Introduction

Hello! This is a sample document in English.
```

**Folder structure after the demo:**

```txt
my-site/
├── docs/  # Vietnamese (default)
│   └── intro.md
├── i18n/
│   └── en/
│       ├── code.json  # Auto-generated code block translations
│       └── docusaurus-plugin-content-docs/
│           └── current/
│               └── intro.md  # English
└── ...
```

**Demo run:**

- `npm start -- --locale en` → <http://localhost:3000/en/docs/intro> (English)
- `npm start` → <http://localhost:3000/docs/intro> (Vietnamese)

## Step 3: Translate UI text (navbar, footer, etc.) (JSON demo)

Run the command to generate translation JSON files.

**Demo command:**

```bash
npm run write-translations  # Generate for all locales
```

It will create files like:

- `i18n/vi/docusaurus-theme-classic/navbar.json` (Vietnamese - can skip because default)
- `i18n/en/docusaurus-theme-classic/navbar.json` (English)

**Sample content for `i18n/en/docusaurus-theme-classic/navbar.json`:**

```json
{
  "title": {
    "message": "My Site",
    "description": "The title in the navbar"
  },
  "item.label.Tutorial": {
    "message": "Tutorial",
    "description": "Navbar item with label Tutorial"
  },
  "item.label.Blog": {
    "message": "Blog",
    "description": "Navbar item with label Blog"
  },
  "item.label.GitHub": {
    "message": "GitHub",
    "description": "Navbar item with label GitHub"
  }
}
```

Translate to English (it is already en, but if customization is needed, edit the `message` values).

Similarly for `footer.json` and `current.json` (for docs labels).

**Demo run:** Restart the site, and the dropdown will show the correct labels (English vs Tiếng Việt).

## Step 4: Add multilingual static pages (src/pages demo)

Assume you have a homepage `src/pages/index.js` in Vietnamese.

**Sample code for `src/pages/index.js` (Vietnamese):**

```js
import React from 'react';
import Layout from '@theme/Layout';

export default function Home() {
  return (
    <Layout title="Trang chủ" description="Mô tả trang chủ">
      <h1>Xin chào từ trang chủ tiếng Việt!</h1>
    </Layout>
  );
}
```

**Create the en version:**
Create the `i18n/en/docusaurus-plugin-content-pages/` folder and an `index.md` file (or `.js` if using React).

```bash
mkdir -p i18n/en/docusaurus-plugin-content-pages
```

Content for `i18n/en/docusaurus-plugin-content-pages/index.md`:

```md
---
title: Home
---

Hello from the English home page!
```

**Demo run:**

- <http://localhost:3000/> (Vietnamese)
- <http://localhost:3000/en/> (English)

## Step 5: Build and deploy (Production demo)

```bash
npm run build
```

Result in `build/`:

- `build/index.html` → Vietnamese
- `build/en/index.html` → English

Deploy to Netlify/GitHub Pages: set the correct baseUrl, and the site will redirect based on browser locale if configured.

## Step 6: Integrate Crowdin (Automation demo - optional)

Install the plugin: `npm install @docusaurus/plugin-client-redirects`

Configure Crowdin: create a project on crowdin.com and connect it to GitHub.

**Demo script in package.json:**

```json
"scripts": {
  "crowdin:upload": "docusaurus crowdin:upload",
  "crowdin:download": "docusaurus crowdin:download"
}
```

Run: `npm run crowdin:upload` to push source files to Crowdin, then pull translations back when complete.

---

## View more

- [i18n issues](https://hkdocs.com/en/docs/tech/docusaurus/solving-docusaurus-i18n-routing-and-deployment-issues/)
