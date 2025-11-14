import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: "Technical Docs",
  favicon: "img/favicon.ico",
  url: "https://github.com",

  // FOR DEPLOY
  baseUrl: "/",
  organizationName: "newtc22222",
  projectName: "technical-documents",
  deploymentBranch: "gh-pages",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  trailingSlash: true,
  onBrokenLinks: "throw",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "vi"],
    localeConfigs: {
      en: {
        label: "English",
        htmlLang: "en-GB",
        direction: "ltr",
      },
      vi: {
        label: "Tiếng Việt",
        htmlLang: "vi-VN",
        direction: "ltr",
      },
    },
  },

  presets: [
    [
      "classic",
      {
        docs: {
          sidebarPath: "./sidebars.ts",
          editUrl:
            "https://github.com/newtc22222/technical-documents/tree/main",
        },
        blog: {
          showReadingTime: true,
          feedOptions: {
            type: ["rss", "atom"],
            xslt: true,
          },

          editUrl:
            "https://github.com/newtc22222/technical-documents/tree/main",
          onInlineTags: "warn",
          onInlineAuthors: "warn",
          onUntruncatedBlogPosts: "warn",
        },
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/docusaurus-social-card.jpg",
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: "Technical Docs",
      // logo: {
      //   alt: "Technical Docs Logo",
      //   src: "img/logo.svg",
      // },
      items: [
        {
          type: "docSidebar",
          sidebarId: "tutorialSidebar",
          position: "left",
          label: "Topics",
        },
        // { to: "blog", label: "Blogs", position: "left" },
        {
          href: "https://github.com/newtc22222",
          label: "GitHub",
          position: "right",
        },
        { type: "localeDropdown", position: "right" },
      ],
    },
    footer: {
      style: "dark",
      copyright: `Copyright © ${new Date().getFullYear()} Technical Docs, Inc. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.vsDark,
      additionalLanguages: [
        "bash",
        "docker",
        "java",
        "markdown",
        "mermaid",
        "sql",
        "yaml",
      ],
    },
  } satisfies Preset.ThemeConfig,

  themes: ["@docusaurus/theme-mermaid"],
  markdown: {
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },
};

export default config;
