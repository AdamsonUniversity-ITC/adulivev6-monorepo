import { useState } from 'react';
import { BookOpen, FileText, HandCoins, ReceiptText } from 'lucide-react';

import { Page, PageHeader } from '../../components/ui/Page';
import AdamsonBudgetLayout from '../../layouts/Screenlayout';

type GuideImage = {
  src: string;
  alt: string;
};

type GuideSection = {
  id: string;
  title: string;
  description: string;
  icon: typeof FileText;
  images: GuideImage[];
};

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'budget-proposal-entry',
    title: 'Budget Proposal Entry',
    description: 'How to select an allocation, add proposal items, and save the proposal.',
    icon: FileText,
    images: [
      {
        src: '/infographics/budget-proposal-entry.jpg',
        alt: 'Budget Proposal Entry user guide',
      },
    ],
  },
  {
    id: 'budget-request-entry',
    title: 'Budget Request Entry',
    description: 'How to create requisitions for stockroom, logistics, and cashier requests.',
    icon: ReceiptText,
    images: [
      {
        src: '/infographics/Budget-Request-Entry-1.jpg',
        alt: 'Budget Request Entry overview and stockroom request guide',
      },
      {
        src: '/infographics/Budget-Request-Entry-2.jpg',
        alt: 'Budget Request Entry stockroom and logistics item guide',
      },
      {
        src: '/infographics/Budget-Request-Entry-3.jpg',
        alt: 'Budget Request Entry cashier and payment request guide',
      },
    ],
  },
  {
    id: 'liquidation-submission',
    title: 'Liquidation Submission',
    description: 'How to open a submitted liquidation, attach documents, and submit it.',
    icon: HandCoins,
    images: [
      {
        src: '/infographics/Liquidation-Submission.jpg',
        alt: 'Liquidation Submission user guide',
      },
    ],
  },
];

function InfographicImage({ image }: { image: GuideImage }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="status"
        className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center dark:border-slate-700 dark:bg-slate-950/40"
      >
        <div>
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-slate-400" aria-hidden="true" />
          <p className="font-semibold text-slate-700 dark:text-slate-200">Infographic unavailable</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{image.alt}</p>
        </div>
      </div>
    );
  }

  return (
    <img
      src={image.src}
      alt={image.alt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="block h-auto w-full rounded-2xl bg-white object-contain"
    />
  );
}

export default function BudgetUserGuides() {
  return (
    <AdamsonBudgetLayout>
      <Page width="wide">
        <PageHeader
          title="Budget User Guides"
          description="Infographics for Budget Proposal Entry, Budget Request Entry, and Liquidation Submission."
        />

        <nav
          aria-label="Infographic sections"
          className="sticky top-3 z-10 grid gap-2 rounded-2xl border border-blue-100 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-blue-950 dark:bg-slate-900/95 sm:grid-cols-3"
        >
          {GUIDE_SECTIONS.map(({ id, title, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-2 text-center text-sm font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {title}
            </a>
          ))}
        </nav>

        {GUIDE_SECTIONS.map(({ id, title, description, icon: Icon, images }) => (
          <section
            key={id}
            id={id}
            aria-labelledby={`${id}-title`}
            className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <header className="flex items-start gap-4 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-5 py-5 dark:border-slate-800 dark:from-blue-950/30 dark:to-slate-900 sm:px-7">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-white shadow-sm">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id={`${id}-title`} className="text-xl font-bold text-slate-950 dark:text-white">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </div>
            </header>

            <div className="space-y-5 bg-slate-100/70 p-3 dark:bg-slate-950/40 sm:p-5 lg:p-7">
              {images.map((image) => (
                <InfographicImage key={image.src} image={image} />
              ))}
            </div>
          </section>
        ))}
      </Page>
    </AdamsonBudgetLayout>
  );
}
