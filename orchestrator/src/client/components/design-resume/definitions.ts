import i18n from "@client/i18n";
import { createId } from "@paralleldrive/cuid2";
import type { ItemFieldConfig } from "./ItemDialog";

export type ItemDefinition = {
  key: string;
  /** English title; also sent to the AI assistant as the section name. */
  title: string;
  singularTitle: string;
  description: string;
  primaryField: string;
  secondaryField?: string;
  fields: ItemFieldConfig[];
  createItem: () => Record<string, unknown>;
};

type ItemSectionKey =
  | "profiles"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "languages"
  | "interests"
  | "awards"
  | "certifications"
  | "publications"
  | "volunteer"
  | "references";

/** Section title in the UI language (falls back to the English title). */
export function getItemDefinitionTitle(definition: ItemDefinition): string {
  return i18n.t(
    `resumeStudio:sections.${definition.key as ItemSectionKey}.title`,
    { defaultValue: definition.title },
  );
}

/** Singular section title in the UI language (e.g. "Experience entry"). */
export function getItemDefinitionSingularTitle(
  definition: ItemDefinition,
): string {
  return i18n.t(
    `resumeStudio:sections.${definition.key as ItemSectionKey}.singular`,
    { defaultValue: definition.singularTitle },
  );
}

/** Section description in the UI language. */
export function getItemDefinitionDescription(
  definition: ItemDefinition,
): string {
  return i18n.t(
    `resumeStudio:sections.${definition.key as ItemSectionKey}.description`,
    { defaultValue: definition.description },
  );
}

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  {
    key: "profiles",
    title: "Profiles",
    singularTitle: "Profile",
    description: "Links and handles shown alongside the resume basics.",
    primaryField: "network",
    secondaryField: "username",
    fields: [
      {
        key: "icon",
        label: "Icon",
        labelKey: "resumeStudio:fields.icon",
        type: "text",
        placeholder: "e.g. tabler:brand-linkedin (Iconify icon name)",
        placeholderKey: "resumeStudio:placeholders.profileIcon",
      },
      {
        key: "network",
        label: "Network",
        labelKey: "resumeStudio:fields.network",
        type: "text",
      },
      {
        key: "username",
        label: "Username",
        labelKey: "resumeStudio:fields.username",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
        placeholder: "https://...",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      icon: "",
      network: "",
      username: "",
      website: { label: "", url: "", inlineLink: false },
    }),
  },
  {
    key: "experience",
    title: "Experience",
    singularTitle: "Experience entry",
    description: "Roles, companies, and rich descriptions.",
    primaryField: "company",
    secondaryField: "position",
    fields: [
      {
        key: "company",
        label: "Company",
        labelKey: "resumeStudio:fields.company",
        type: "text",
      },
      {
        key: "location",
        label: "Location",
        labelKey: "resumeStudio:fields.workLocation",
        type: "text",
      },
      {
        key: "position",
        label: "Position",
        labelKey: "resumeStudio:fields.position",
        type: "text",
        aiAssist: true,
      },
      {
        key: "period",
        label: "Period",
        labelKey: "resumeStudio:fields.period",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
        placeholder: "https://...",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.experienceDescription",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      company: "",
      location: "",
      position: "",
      period: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
      roles: [],
    }),
  },
  {
    key: "education",
    title: "Education",
    singularTitle: "Education entry",
    description: "Schooling, degrees, and achievements.",
    primaryField: "school",
    secondaryField: "degree",
    fields: [
      {
        key: "school",
        label: "School",
        labelKey: "resumeStudio:fields.school",
        type: "text",
      },
      {
        key: "area",
        label: "Area",
        labelKey: "resumeStudio:fields.area",
        type: "text",
      },
      {
        key: "degree",
        label: "Degree",
        labelKey: "resumeStudio:fields.degree",
        type: "text",
      },
      {
        key: "grade",
        label: "Grade",
        labelKey: "resumeStudio:fields.grade",
        type: "text",
      },
      {
        key: "location",
        label: "Location",
        labelKey: "resumeStudio:fields.location",
        type: "text",
      },
      {
        key: "period",
        label: "Period",
        labelKey: "resumeStudio:fields.period",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      school: "",
      area: "",
      degree: "",
      grade: "",
      location: "",
      period: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "projects",
    title: "Projects",
    singularTitle: "Project",
    description:
      "Choose how each project should be used when tailoring resumes: exclude it, let AI include it when relevant, or always include it.",
    primaryField: "name",
    secondaryField: "period",
    fields: [
      {
        key: "name",
        label: "Name",
        labelKey: "resumeStudio:fields.projectName",
        type: "text",
        aiAssist: true,
      },
      {
        key: "period",
        label: "Period",
        labelKey: "resumeStudio:fields.period",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      name: "",
      period: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "skills",
    title: "Skills",
    singularTitle: "Skill group",
    description: "Categories and keywords used for tailoring output.",
    primaryField: "name",
    secondaryField: "proficiency",
    fields: [
      {
        key: "icon",
        label: "Icon",
        labelKey: "resumeStudio:fields.icon",
        type: "icon",
        groupWithNext: true,
      },
      {
        key: "name",
        label: "Name",
        labelKey: "resumeStudio:fields.skillName",
        type: "text",
        required: true,
        placeholder: "e.g. Python, or Programming Languages",
        placeholderKey: "resumeStudio:placeholders.skillName",
        aiAssist: true,
      },
      {
        key: "proficiency",
        label: "Proficiency",
        labelKey: "resumeStudio:fields.proficiency",
        type: "text",
      },
      {
        key: "level",
        label: "Level",
        labelKey: "resumeStudio:fields.level",
        type: "number",
        min: 0,
        step: 1,
      },
      {
        key: "keywords",
        label: "Keywords",
        labelKey: "resumeStudio:fields.keywords",
        type: "tags",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      icon: "",
      name: "",
      proficiency: "",
      level: 3,
      keywords: [],
    }),
  },
  {
    key: "languages",
    title: "Languages",
    singularTitle: "Language",
    description: "Spoken or written languages.",
    primaryField: "language",
    secondaryField: "fluency",
    fields: [
      {
        key: "language",
        label: "Language",
        labelKey: "resumeStudio:fields.language",
        type: "text",
      },
      {
        key: "fluency",
        label: "Fluency",
        labelKey: "resumeStudio:fields.fluency",
        type: "text",
      },
      {
        key: "level",
        label: "Level",
        labelKey: "resumeStudio:fields.level",
        type: "number",
        min: 0,
        step: 1,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      language: "",
      fluency: "",
      level: 3,
    }),
  },
  {
    key: "interests",
    title: "Interests",
    singularTitle: "Interest",
    description: "Interests and topic clusters.",
    primaryField: "name",
    secondaryField: "icon",
    fields: [
      {
        key: "icon",
        label: "Icon",
        labelKey: "resumeStudio:fields.icon",
        type: "text",
        placeholder: "e.g. tabler:brand-python (Iconify icon name)",
        placeholderKey: "resumeStudio:placeholders.interestIcon",
      },
      {
        key: "name",
        label: "Name",
        labelKey: "resumeStudio:fields.interestName",
        type: "text",
        aiAssist: true,
      },
      {
        key: "keywords",
        label: "Keywords",
        labelKey: "resumeStudio:fields.keywords",
        type: "tags",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      icon: "",
      name: "",
      keywords: [],
    }),
  },
  {
    key: "awards",
    title: "Awards",
    singularTitle: "Award",
    description: "Awards and recognitions.",
    primaryField: "title",
    secondaryField: "awarder",
    fields: [
      {
        key: "title",
        label: "Title",
        labelKey: "resumeStudio:fields.awardTitle",
        type: "text",
        aiAssist: true,
      },
      {
        key: "awarder",
        label: "Awarder",
        labelKey: "resumeStudio:fields.awarder",
        type: "text",
      },
      {
        key: "date",
        label: "Date",
        labelKey: "resumeStudio:fields.date",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      title: "",
      awarder: "",
      date: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "certifications",
    title: "Certifications",
    singularTitle: "Certification",
    description: "Formal certificates and credentials.",
    primaryField: "title",
    secondaryField: "issuer",
    fields: [
      {
        key: "title",
        label: "Title",
        labelKey: "resumeStudio:fields.certificationTitle",
        type: "text",
        aiAssist: true,
      },
      {
        key: "issuer",
        label: "Issuer",
        labelKey: "resumeStudio:fields.issuer",
        type: "text",
      },
      {
        key: "date",
        label: "Date",
        labelKey: "resumeStudio:fields.date",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      title: "",
      issuer: "",
      date: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "publications",
    title: "Publications",
    singularTitle: "Publication",
    description: "Published writing and papers.",
    primaryField: "title",
    secondaryField: "publisher",
    fields: [
      {
        key: "title",
        label: "Title",
        labelKey: "resumeStudio:fields.title",
        type: "text",
        aiAssist: true,
      },
      {
        key: "publisher",
        label: "Publisher",
        labelKey: "resumeStudio:fields.publisher",
        type: "text",
      },
      {
        key: "date",
        label: "Date",
        labelKey: "resumeStudio:fields.date",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      title: "",
      publisher: "",
      date: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "volunteer",
    title: "Volunteer",
    singularTitle: "Volunteer entry",
    description: "Volunteer work and community contributions.",
    primaryField: "organization",
    secondaryField: "period",
    fields: [
      {
        key: "organization",
        label: "Organization",
        labelKey: "resumeStudio:fields.organization",
        type: "text",
        aiAssist: true,
      },
      {
        key: "location",
        label: "Location",
        labelKey: "resumeStudio:fields.location",
        type: "text",
      },
      {
        key: "period",
        label: "Period",
        labelKey: "resumeStudio:fields.period",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      organization: "",
      location: "",
      period: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
  {
    key: "references",
    title: "References",
    singularTitle: "Reference",
    description: "References and supporting contacts.",
    primaryField: "name",
    secondaryField: "position",
    fields: [
      {
        key: "name",
        label: "Name",
        labelKey: "resumeStudio:fields.referenceName",
        type: "text",
        aiAssist: true,
      },
      {
        key: "position",
        label: "Position",
        labelKey: "resumeStudio:fields.position",
        type: "text",
        aiAssist: true,
      },
      {
        key: "phone",
        label: "Phone",
        labelKey: "resumeStudio:fields.phone",
        type: "text",
      },
      {
        key: "website.url",
        label: "Website",
        labelKey: "resumeStudio:fields.website",
        type: "text",
      },
      {
        key: "website.inlineLink",
        label: "Show link in title",
        labelKey: "resumeStudio:fields.showLinkInTitle",
        type: "toggle",
      },
      {
        key: "description",
        label: "Description",
        labelKey: "resumeStudio:fields.description",
        type: "richtext",
        aiAssist: true,
      },
    ],
    createItem: () => ({
      id: createId(),
      hidden: false,
      name: "",
      position: "",
      phone: "",
      website: { label: "", url: "", inlineLink: false },
      description: "",
    }),
  },
];
