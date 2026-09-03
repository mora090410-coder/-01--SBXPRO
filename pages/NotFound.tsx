import React from 'react';
import { Link } from 'react-router-dom';
import { PageMetadata } from '../components/seo/PageMetadata';
import { Eyebrow } from '../src/design/primitives';
import { SitePage } from '../src/features/site';
import { primaryLink, quietLink } from '../src/features/homepage/sections/cta';

const NotFound: React.FC = () => (
  <SitePage width="prose" withFooter={false}>
    <PageMetadata
      title="Page not found | GridOne"
      description="The GridOne page or board link you requested could not be found."
      path="/404"
      noIndex
    />
    <div className="flex flex-col gap-4">
      <Eyebrow>404 · Off the board</Eyebrow>
      <h1 className="font-display text-[40px] leading-[1.05] text-fg md:text-[52px]">This link does not point to a page.</h1>
      <p className="font-ui text-[19px] leading-[1.5] text-fg-2">Check the address, ask the organizer for a fresh board link, or return to GridOne.</p>
    </div>
    <div className="mt-8 flex flex-wrap gap-3">
      <Link className={primaryLink} to="/">Return to GridOne</Link>
      <Link className={quietLink} to="/create">Create a new board</Link>
      <Link className={quietLink} to="/demo">See the demo board</Link>
    </div>
  </SitePage>
);

export default NotFound;
