import React from 'react';
import { Link } from 'react-router-dom';
import { Eyebrow, Glass } from '../../src/design/primitives';
import { primaryLink, quietLink } from '../../src/features/homepage/sections/cta';

type LinkItem = {
  to: string;
  label: string;
  primary?: boolean;
};

type Props = {
  title?: string;
  links: LinkItem[];
};

export const ArticleCTA: React.FC<Props> = ({ title = 'Related guides', links }) => {
  return (
    <Glass padding="lg" role="group" aria-label={title} className="mt-16 flex flex-col gap-6">
      <Eyebrow>{title}</Eyebrow>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {links.map((link) => (
          <Link key={link.to} to={link.to} className={link.primary ? primaryLink : quietLink}>
            {link.label}
          </Link>
        ))}
      </div>
    </Glass>
  );
};
