import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Homepage from '../../src/features/homepage/Homepage';
import { HeroViewer } from '../../src/features/homepage/renders/HeroViewer';
import { OrganizerPreview } from '../../src/features/homepage/renders/OrganizerPreview';
import { ScenariosRender, YourSquaresRender } from '../../src/features/homepage/renders/MomentRenders';

const HERO_CAPTION = 'Sample live board: KC 17, PHI 14, third quarter';
const ORGANIZER_CAPTION = 'Organizer workspace with 61 of 100 squares filled';

/** The loaded render, found by content only the real component produces. */
const frameFor = (node: HTMLElement) => {
  const figure = node.closest('figure')!;
  const region = figure.querySelector('[aria-hidden="true"]') as HTMLElement;
  return { figure, region };
};

describe('HeroViewer', () => {
  it('renders the real viewer inside an inert figure captioned with the demo teams', async () => {
    render(<HeroViewer />);
    const title = await screen.findByText('Lincoln Softball Booster Board');
    const { figure, region } = frameFor(title);
    expect(within(figure).getByText(HERO_CAPTION)).toBeInTheDocument();
    expect(region).toHaveAttribute('inert');
    expect(region).toContainElement(title);
  });

  it('renders no main landmark of its own', async () => {
    render(<HeroViewer />);
    await screen.findByText('Lincoln Softball Booster Board');
    expect(screen.queryByRole('main')).toBeNull();
  });
});

describe('OrganizerPreview', () => {
  it('renders the real board editor behind an inert figure with the fill caption', async () => {
    render(<OrganizerPreview />);
    const toggle = await screen.findByText('Select squares');
    const { figure, region } = frameFor(toggle);
    expect(within(figure).getByText(ORGANIZER_CAPTION)).toBeInTheDocument();
    expect(region).toHaveAttribute('inert');
    expect(region.querySelector('[data-base="cream"]')).not.toBeNull();
    expect(region.querySelectorAll('button[aria-label^="Square "]').length).toBe(100);
    expect(region.querySelectorAll('button[aria-label$="unassigned"]').length).toBe(39);
  });
});

describe('parent moment renders', () => {
  it('shows the real square summary, inert and captioned', async () => {
    render(<YourSquaresRender />);
    const heading = await screen.findByText('Your squares · Taylor M.');
    const { figure, region } = frameFor(heading);
    expect(within(figure).getByText(/Sample square summary: Taylor M\. holds 3 squares/)).toBeInTheDocument();
    expect(region).toHaveAttribute('inert');
  });

  it('shows the real next-score list, inert and captioned', async () => {
    render(<ScenariosRender />);
    const heading = await screen.findByText('What score changes the next result?');
    const { figure, region } = frameFor(heading);
    expect(within(figure).getByText('Sample list of scores that change the next result on the demo board')).toBeInTheDocument();
    expect(region).toHaveAttribute('inert');
  });
});

describe('Homepage with the renders resolved', () => {
  it('keeps one main landmark and never nests another inside it', async () => {
    render(<MemoryRouter><Homepage /></MemoryRouter>);
    await screen.findByText('Lincoln Softball Booster Board');
    await screen.findByText('Select squares');
    expect(screen.getAllByRole('main').length).toBe(1);
    expect(screen.getByRole('main')).toHaveAttribute('data-testid', 'homepage');
  });
});
