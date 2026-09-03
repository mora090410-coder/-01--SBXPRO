import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

vi.mock('../../services/supabase', () => ({
  supabase: { auth: { signOut: vi.fn().mockResolvedValue({ error: null }) } },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

import { ArticlesHub } from '../../pages/ArticlesHub';
import { RunYourPoolAlternative } from '../../pages/RunYourPoolAlternative';
import { HowToRunSquares } from '../../pages/HowToRunSquares';
import { FootballSquaresFundraiser } from '../../pages/FootballSquaresFundraiser';
import { OfficeSuperBowlSquares } from '../../pages/OfficeSuperBowlSquares';
import { HowFootballSquaresWork } from '../../pages/HowFootballSquaresWork';
import { YouthSportsFootballSquaresFundraiser } from '../../pages/YouthSportsFootballSquaresFundraiser';
import { SuperBowlSquaresIdeas } from '../../pages/SuperBowlSquaresIdeas';
import { DigitalFootballSquaresBoardVsPaper } from '../../pages/DigitalFootballSquaresBoardVsPaper';
import { BoosterClubFootballSquares } from '../../pages/BoosterClubFootballSquares';
import { ChurchSchoolFundraiserSquares } from '../../pages/ChurchSchoolFundraiserSquares';
import { NFLOpeningWeekSquares } from '../../pages/NFLOpeningWeekSquares';
import { FootballSquaresApp } from '../../pages/FootballSquaresApp';

// Class names from the retired cream/newsprint shell. None may survive on a
// site page now that every route sits on the Broadcast Glass dark base.
const LEGACY_CLASS = /\boa-|\bgdh-|text-ink|bg-broadcast-white|bg-newsprint/;

type PageCase = {
  name: string;
  Page: React.FC;
  /** The page's `title` const: what PageMetadata writes to document.title. */
  title: string;
  /** The visible h1, which is not always the metadata title. */
  heading: string;
  /** aria-label of the ArticleCTA group and how many links it renders. */
  cta?: { label: string; links: number };
};

const PAGES: PageCase[] = [
  {
    name: 'ArticlesHub',
    Page: ArticlesHub,
    title: 'GridOne Articles and Guides | Football Squares, Fundraisers, and Super Bowl Squares',
    heading: 'Football squares guides for organizers',
  },
  {
    name: 'RunYourPoolAlternative',
    Page: RunYourPoolAlternative,
    title: 'RunYourPool Alternative for Football Squares | GridOne',
    heading: 'A focused RunYourPool alternative for football squares',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'HowToRunSquares',
    Page: HowToRunSquares,
    title: 'How to Run Super Bowl Squares Online | GridOne',
    heading: 'How to Run a Super Bowl Squares Pool Online',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'FootballSquaresFundraiser',
    Page: FootballSquaresFundraiser,
    title: 'Football Squares Fundraiser Ideas That Are Easier to Run Online | GridOne',
    heading: 'Football squares fundraiser ideas that do not turn into poster-board chaos',
    cta: { label: 'Build a fundraiser board', links: 4 },
  },
  {
    name: 'OfficeSuperBowlSquares',
    Page: OfficeSuperBowlSquares,
    title: 'Office Super Bowl Squares Without Spreadsheet Chaos | GridOne',
    heading: 'Office Super Bowl squares without the spreadsheet circus',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'HowFootballSquaresWork',
    Page: HowFootballSquaresWork,
    title: 'How Football Squares Work, Simple Rules and Setup | GridOne',
    heading: 'How football squares work',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'YouthSportsFootballSquaresFundraiser',
    Page: YouthSportsFootballSquaresFundraiser,
    title: 'Youth Sports Football Squares Fundraiser Guide | GridOne',
    heading: 'Youth sports football squares fundraiser guide',
    cta: { label: 'Build a fundraiser board', links: 3 },
  },
  {
    name: 'SuperBowlSquaresIdeas',
    Page: SuperBowlSquaresIdeas,
    title: 'Super Bowl Squares Ideas for Fundraisers, Offices, and Parties | GridOne',
    heading: 'Super Bowl squares ideas that do not suck',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'DigitalFootballSquaresBoardVsPaper',
    Page: DigitalFootballSquaresBoardVsPaper,
    title: 'Digital Football Squares Board vs Paper Board | GridOne',
    heading: 'Digital football squares board vs paper board',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'BoosterClubFootballSquares',
    Page: BoosterClubFootballSquares,
    title: 'Booster Club Football Squares Fundraiser Guide | GridOne',
    heading: 'Booster club football squares fundraiser guide',
    cta: { label: 'Build a fundraiser board', links: 3 },
  },
  {
    name: 'ChurchSchoolFundraiserSquares',
    Page: ChurchSchoolFundraiserSquares,
    title: 'Church and School Football Squares Fundraiser Ideas | GridOne',
    heading: 'Church and school football squares fundraiser ideas',
    cta: { label: 'Build a fundraiser board', links: 3 },
  },
  {
    name: 'NFLOpeningWeekSquares',
    Page: NFLOpeningWeekSquares,
    title: 'NFL Opening Week Squares Pool Ideas | GridOne',
    heading: 'NFL opening week squares pool ideas',
    cta: { label: 'Related guides', links: 3 },
  },
  {
    name: 'FootballSquaresApp',
    Page: FootballSquaresApp,
    title: 'Football Squares App for Fundraisers, Offices, and Watch Parties | GridOne',
    heading: 'What a good football squares app should actually do',
    cta: { label: 'Build a fundraiser board', links: 3 },
  },
];

afterEach(() => {
  document.title = '';
});

describe('site articles and hub', () => {
  it('covers every lazy-loaded article route plus the hub', () => {
    expect(PAGES).toHaveLength(13);
  });

  PAGES.forEach(({ name, Page, title, heading, cta }) => {
    describe(name, () => {
      it('renders one h1 on the dark base with no legacy class names', () => {
        const { container } = render(<MemoryRouter><Page /></MemoryRouter>);

        const h1s = screen.getAllByRole('heading', { level: 1 });
        expect(h1s).toHaveLength(1);
        expect(h1s[0]).toHaveTextContent(heading);

        expect(container.querySelectorAll('[data-base]')).toHaveLength(1);
        expect(container.querySelector('[data-base]')).toHaveAttribute('data-base', 'dark');

        const offenders = Array.from(container.querySelectorAll('[class]'))
          .map((element) => element.getAttribute('class') ?? '')
          .filter((className) => LEGACY_CLASS.test(className));
        expect(offenders).toEqual([]);
      });

      it('keeps its metadata title', async () => {
        render(<MemoryRouter><Page /></MemoryRouter>);
        await waitFor(() => expect(document.title).toBe(title));
      });

      if (cta) {
        it(`keeps ${cta.links} links in the ${cta.label} group`, () => {
          render(<MemoryRouter><Page /></MemoryRouter>);
          const group = screen.getByRole('group', { name: cta.label });
          expect(within(group).getAllByRole('link')).toHaveLength(cta.links);
        });
      } else {
        it('links to every guide in the hub list', () => {
          render(<MemoryRouter><Page /></MemoryRouter>);
          expect(screen.getAllByText('Read guide')).toHaveLength(12);
        });
      }
    });
  });
});
