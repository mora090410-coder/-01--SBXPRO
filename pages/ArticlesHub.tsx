import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { PageMetadata } from '../components/seo/PageMetadata';

const ARTICLES = [
  {
    title: 'How to Run Super Bowl Squares Online',
    desc: 'Step-by-step guide for building, sharing, and managing football squares without poster-board confusion.',
    to: '/articles/how-to-run-super-bowl-squares',
    tag: 'How-to',
  },
  {
    title: 'Football Squares Fundraiser Ideas',
    desc: 'Fundraiser-focused guidance for booster clubs, youth teams, churches, and community groups.',
    to: '/articles/football-squares-fundraiser',
    tag: 'Fundraiser',
  },
  {
    title: 'Youth Sports Football Squares Fundraiser',
    desc: 'A tighter playbook for parent organizers and booster clubs running football squares to raise money.',
    to: '/articles/youth-sports-football-squares-fundraiser',
    tag: 'Youth sports',
  },
  {
    title: 'Office Super Bowl Squares',
    desc: 'Run an office board with better mobile viewing and fewer winner questions.',
    to: '/articles/office-super-bowl-squares',
    tag: 'Office',
  },
  {
    title: 'How Football Squares Work',
    desc: 'Plain-English explanation of the 10x10 grid, random numbers, and quarter winners.',
    to: '/articles/how-football-squares-work',
    tag: 'Explainer',
  },
  {
    title: 'Super Bowl Squares Ideas',
    desc: 'Simple ideas to make your board easier to run and more fun for the whole group.',
    to: '/articles/super-bowl-squares-ideas',
    tag: 'Seasonal',
  },
  {
    title: 'Digital Football Squares Board vs Paper Board',
    desc: 'A direct comparison between old-school poster boards and a live digital viewer link.',
    to: '/articles/digital-football-squares-board-vs-paper',
    tag: 'Comparison',
  },
  {
    title: 'Booster Club Football Squares Fundraiser Guide',
    desc: 'A practical guide for booster clubs that need a cleaner way to run a football-squares fundraiser.',
    to: '/articles/booster-club-football-squares',
    tag: 'Booster club',
  },
  {
    title: 'Church and School Football Squares Fundraiser Ideas',
    desc: 'How schools and churches can run a clear, organizer-owned football-squares fundraiser.',
    to: '/articles/church-school-football-squares-fundraiser',
    tag: 'School / church',
  },
  {
    title: 'NFL Opening Week Squares Pool Ideas',
    desc: 'Ideas for opening-week office boards, watch parties, and community events.',
    to: '/articles/nfl-opening-week-squares-pool',
    tag: 'NFL opening week',
  },
  {
    title: 'Football Squares App',
    desc: 'What to look for in a football-squares app before you build and share a board.',
    to: '/articles/football-squares-app',
    tag: 'Category',
  },
  {
    title: 'RunYourPool Alternative',
    desc: 'Compare a focused football-squares board with broader pool platforms.',
    to: '/articles/run-your-pool-alternative',
    tag: 'Alternative',
  },
];

export const ArticlesHub: React.FC = () => {
  const title = 'GridOne Articles and Guides | Football Squares, Fundraisers, and Super Bowl Squares';
  const description = 'GridOne guides for football squares, Super Bowl squares, fundraisers, office pools, and digital board alternatives.';

  return (
    <div className="oa-root min-h-screen bg-broadcast-white text-ink font-sans selection:bg-gold/30 flex flex-col overflow-x-hidden">
      <PageMetadata
        title={title}
        description={description}
        path="/articles"
        type="website"
        schema={{
          '@type': 'CollectionPage',
          name: title,
          description,
          url: 'https://www.getgridone.com/articles',
        }}
      />
      <Header />
      <main className="mx-auto w-full max-w-6xl px-5 py-24 duration-700">
        <div className="max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-control bg-newsprint px-3 py-1 text-xs text-gold ring-1 ring-gold/20">
            Organizer guides
          </div>
          <h1 className="oa-chyron text-4xl font-semibold tracking-tight md:text-5xl text-ink mb-6">
            Football squares guides for organizers
          </h1>
          <p className="text-xl text-ink/70 mb-12 leading-relaxed">
            Practical help for fundraiser teams, booster clubs, offices, and community groups that need one clean board link.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {ARTICLES.map((article) => (
            <Link key={article.to} to={article.to} className="rounded-surface bg-newsprint p-6 ring-1 ring-white/10 hover:bg-newsprint transition-colors">
              <div className="inline-flex rounded-control bg-newsprint px-3 py-1 text-xs text-gold ring-1 ring-gold/20">{article.tag}</div>
              <h2 className="oa-headline mt-4 text-xl font-semibold text-ink">{article.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{article.desc}</p>
              <div className="mt-5 text-sm font-medium text-gold">Read guide →</div>
            </Link>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start gap-3 border border-ink bg-newsprint p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="text-2xl font-black">Ready to run your board?</h2><p className="mt-1 text-ink/70">Build and preview for free. Your first published board is free.</p></div>
          <Link to="/create" className="oa-btn oa-btn-cardinal">Create your free board</Link>
        </div>
      </main>
    </div>
  );
};
