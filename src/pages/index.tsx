import type { ReactNode } from "react";
import Link from "@docusaurus/Link";
import Translate, { translate } from "@docusaurus/Translate";
import Layout from "@theme/Layout";

import styles from "./index.module.css";

type Section = { label: string; to: string };

type DocSet = {
  name: string;
  to: string;
  summary: string;
  sections: Section[];
};

// Section links point at the first doc of each sidebar category (or its
// generated index). onBrokenLinks: "throw" fails the build if one goes stale.
function useDocSets(): DocSet[] {
  return [
    {
      name: "FF RESTaurent",
      to: "/docs/ff-restaurent/",
      summary: translate({
        id: "homepage.ffRestaurent.summary",
        message:
          "Group bill-splitting and restaurant tracker. How to build it, deploy it and run it in production.",
      }),
      sections: [
        {
          label: translate({ id: "homepage.ffRestaurent.development", message: "Development" }),
          to: "/docs/ff-restaurent/development/backend-development/",
        },
        {
          label: translate({ id: "homepage.ffRestaurent.domainContracts", message: "Domain contracts" }),
          to: "/docs/ff-restaurent/domain-contracts/password-and-session-contract/",
        },
        {
          label: translate({
            id: "homepage.ffRestaurent.deployment",
            message: "Deployment & infrastructure",
          }),
          to: "/docs/ff-restaurent/deployment-infrastructure/deployment-guide/",
        },
        {
          label: translate({ id: "homepage.ffRestaurent.runbooks", message: "Runbooks & operations" }),
          to: "/docs/ff-restaurent/runbooks-operations/production-runbook/",
        },
        {
          label: translate({ id: "homepage.ffRestaurent.performance", message: "Performance" }),
          to: "/docs/ff-restaurent/performance/ff-27-optimization/",
        },
        {
          label: translate({ id: "homepage.ffRestaurent.releases", message: "Releases" }),
          to: "/docs/ff-restaurent/releases/release-v2.3.0-rc.1/",
        },
      ],
    },
    {
      name: "LinguFlow",
      to: "/docs/lingu-flow/",
      summary: translate({
        id: "homepage.linguFlow.summary",
        message:
          "Keyboard-driven practice for HSK, JLPT, TOEIC and IELTS, with spaced repetition and AI assistance.",
      }),
      sections: [
        {
          label: translate({ id: "homepage.linguFlow.architecture", message: "Architecture" }),
          to: "/docs/lingu-flow/architecture/application-overview/",
        },
        {
          label: translate({ id: "homepage.linguFlow.features", message: "Features" }),
          to: "/docs/lingu-flow/features/ai-features/",
        },
        {
          label: translate({ id: "homepage.linguFlow.operations", message: "Operations & DevOps" }),
          to: "/docs/lingu-flow/operations/deployment-guide/",
        },
        {
          label: translate({ id: "homepage.linguFlow.releases", message: "Release notes" }),
          to: "/docs/lingu-flow/releases/release-v1.4.0/",
        },
      ],
    },
    {
      name: "Laptech",
      to: "/docs/laptech/intro/",
      summary: translate({
        id: "homepage.laptech.summary",
        message:
          "Spring Boot authentication and authorization module, with JWT, refresh-token rotation and role-based access.",
      }),
      sections: [
        {
          label: translate({ id: "homepage.laptech.architecture", message: "Architecture" }),
          to: "/docs/laptech/overview/architecture/",
        },
        {
          label: translate({ id: "homepage.laptech.setup", message: "Setup & installation" }),
          to: "/docs/laptech/setup/installation/",
        },
        {
          label: translate({ id: "homepage.laptech.apiReference", message: "API reference" }),
          to: "/docs/category/api-reference/",
        },
        {
          label: translate({ id: "homepage.laptech.troubleshooting", message: "Troubleshooting" }),
          to: "/docs/laptech/troubleshooting/",
        },
      ],
    },
    {
      name: translate({ id: "homepage.guides.name", message: "Guides" }),
      to: "/docs/category/building-app/",
      summary: translate({
        id: "homepage.guides.summary",
        message: "General engineering notes that are not tied to one project.",
      }),
      sections: [
        {
          label: translate({ id: "homepage.guides.buildingApp", message: "Building apps" }),
          to: "/docs/category/building-app/",
        },
        {
          label: translate({ id: "homepage.guides.libraries", message: "Libraries and features" }),
          to: "/docs/category/libraries-and-features/",
        },
        {
          label: translate({ id: "homepage.guides.llmPrompting", message: "LLM prompting" }),
          to: "/docs/category/llm-prompting/",
        },
        {
          label: translate({ id: "homepage.guides.versionControl", message: "Version control" }),
          to: "/docs/category/version-control/",
        },
      ],
    },
  ];
}

function DocSetRow({ name, to, summary, sections }: DocSet): ReactNode {
  return (
    <section className={styles.row}>
      <div>
        <h2 className={styles.name}>
          <Link to={to}>{name}</Link>
        </h2>
        <p className={styles.summary}>{summary}</p>
      </div>
      <ul className={styles.sections}>
        {sections.map((section) => (
          <li key={section.to}>
            <Link to={section.to}>{section.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Home(): ReactNode {
  const docSets = useDocSets();
  return (
    <Layout
      description={translate({
        id: "homepage.description",
        message:
          "Architecture, runbooks and API references for FF RESTaurent, LinguFlow and Laptech.",
      })}
    >
      <main className={styles.page}>
        <header className={styles.intro}>
          <h1 className={styles.title}>
            <Translate id="homepage.title">Project documentation</Translate>
          </h1>
          <p className={styles.lead}>
            <Translate id="homepage.lead">
              Architecture, runbooks and API references for FF RESTaurent,
              LinguFlow and Laptech, plus general engineering guides.
            </Translate>
          </p>
        </header>
        <div className={styles.index}>
          {docSets.map((set) => (
            <DocSetRow key={set.to} {...set} />
          ))}
        </div>
      </main>
    </Layout>
  );
}
