# Thiết lập i18n (quốc tế hóa) trong Docusaurus

## Bước 0: Chuẩn bị dự án Docusaurus mới (nếu chưa có)

Nếu bạn chưa có dự án, tạo nhanh một cái đơn giản.

```bash
npx create-docusaurus@latest my-site classic
cd my-site
npm install
```

Cấu trúc ban đầu:

```txt
my-site/
├── docusaurus.config.js
├── docs/
│   └── intro.md  # Nội dung mẫu: "Hello from Docusaurus"
├── src/
│   └── pages/
│       └── index.js
└── package.json
```

Chạy thử: `npm run start` → Truy cập <http://localhost:3000> để xem site mặc định.

## Bước 1: Bật i18n trong config (Demo cấu hình cơ bản)

Mở `docusaurus.config.js` và thêm phần i18n. Đây là demo đầy đủ với 2 ngôn ngữ.

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

  i18n: {  // <--- Demo i18n ở đây
    defaultLocale: 'vi',  // Tiếng Việt là mặc định
    locales: ['vi', 'en'],  // Hỗ trợ vi và en
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
            type: 'localeDropdown',  // <--- Thêm dropdown ngôn ngữ
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          // ... (giữ nguyên)
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

**Demo chạy:** `npm run start` → Bây giờ site có dropdown ngôn ngữ, nhưng chưa có bản dịch nên en sẽ fallback về vi.

## Bước 2: Tạo cấu trúc thư mục cho bản dịch (Demo tách docs)

Giả sử docs gốc (`docs/intro.md`) đang bằng tiếng Việt. Chúng ta sẽ copy sang en để dịch.

**Nội dung demo cho docs gốc (tiếng Việt):**
Mở `docs/intro.md` và viết:

```md
---
sidebar_position: 1
---

# Giới thiệu

Xin chào! Đây là tài liệu mẫu bằng tiếng Việt.
```

**Lệnh demo để tách sang en:**

```bash
# Tạo file JSON bản dịch cơ bản cho en
npm run write-translations -- --locale en

# Copy docs tiếng Việt sang thư mục en để dịch
mkdir -p i18n/en/docusaurus-plugin-content-docs/current
cp -r docs/* i18n/en/docusaurus-plugin-content-docs/current/
```

**Dịch demo cho en:**
Mở `i18n/en/docusaurus-plugin-content-docs/current/intro.md` và sửa thành:

```md
---
sidebar_position: 1
---

# Introduction

Hello! This is a sample document in English.
```

**Cấu trúc thư mục sau demo:**

```txt
my-site/
├── docs/  # Tiếng Việt (default)
│   └── intro.md
├── i18n/
│   └── en/
│       ├── code.json  # Bản dịch code blocks (tạo tự động)
│       └── docusaurus-plugin-content-docs/
│           └── current/
│               └── intro.md  # Tiếng Anh
└── ...
```

**Demo chạy:**

- `npm start -- --locale en` → <http://localhost:3000/en/docs/intro> (xem tiếng Anh)
- `npm start` → <http://localhost:3000/docs/intro> (tiếng Việt)

## Bước 3: Dịch giao diện (navbar, footer, etc.) (Demo với JSON)

Chạy lệnh để tạo file JSON bản dịch.

**Lệnh demo:**

```bash
npm run write-translations  # Tạo cho tất cả locales
```

Nó sẽ tạo các file như:

- `i18n/vi/docusaurus-theme-classic/navbar.json` (tiếng Việt - nhưng vì default, có thể skip)
- `i18n/en/docusaurus-theme-classic/navbar.json` (tiếng Anh)

**Demo nội dung cho `i18n/en/docusaurus-theme-classic/navbar.json`:**

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

Dịch sang tiếng Anh (thực ra đã là en rồi, nhưng nếu cần tùy chỉnh, bạn sửa "message").

Tương tự cho `footer.json`, `current.json` (cho docs labels).

**Demo chạy:** Khởi động lại site, dropdown sẽ hiển thị label đúng (English vs Tiếng Việt).

## Bước 4: Thêm trang tĩnh đa ngôn ngữ (Demo cho src/pages)

Giả sử bạn có trang chủ `src/pages/index.js` bằng tiếng Việt.

**Demo code cho `src/pages/index.js` (tiếng Việt):**

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

**Tạo phiên bản en:**
Tạo thư mục `i18n/en/docusaurus-plugin-content-pages/` và file `index.md` (hoặc .js nếu dùng React).

```bash
mkdir -p i18n/en/docusaurus-plugin-content-pages
```

Nội dung `i18n/en/docusaurus-plugin-content-pages/index.md`:

```md
---
title: Home
---

Hello from the English home page!
```

**Demo chạy:**

- <http://localhost:3000/> (tiếng Việt)
- <http://localhost:3000/en/> (tiếng Anh)

## Bước 5: Build và deploy (Demo production)

```bash
npm run build
```

Kết quả trong `build/`:

- `build/index.html` → Tiếng Việt
- `build/en/index.html` → Tiếng Anh

Deploy lên Netlify/Github Pages: Thêm baseUrl đúng, và site sẽ tự redirect dựa trên browser locale nếu cấu hình.

## Bước 6: Tích hợp Crowdin (Demo tự động hóa - optional)

Cài plugin: `npm install @docusaurus/plugin-client-redirects`

Config Crowdin: Tạo project trên crowdin.com, liên kết với GitHub.

**Demo script trong package.json:**

```json
"scripts": {
  "crowdin:upload": "docusaurus crowdin:upload",
  "crowdin:download": "docusaurus crowdin:download"
}
```

Chạy: `npm run crowdin:upload` để push nguồn lên Crowdin, sau khi dịch xong pull về.

---

## View more

- [i18n issues](https://hkdocs.com/en/docs/tech/docusaurus/solving-docusaurus-i18n-routing-and-deployment-issues/)
