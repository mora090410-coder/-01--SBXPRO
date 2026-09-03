import React from 'react';
import { Base } from '../../design/primitives';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';

const WIDTH = {
  prose: 'max-w-[720px]',
  wide: 'max-w-[1100px]',
} as const;

export interface SitePageProps {
  children: React.ReactNode;
  width?: keyof typeof WIDTH;
  withFooter?: boolean;
  /** Drops the header's Sign in link on pages that are the sign-in page. */
  hideSignIn?: boolean;
  mainProps?: React.HTMLAttributes<HTMLElement>;
}

/** Header, one main, footer on the dark base. Base is the only data-base here. */
export function SitePage({ children, width = 'prose', withFooter = true, hideSignIn = false, mainProps }: SitePageProps) {
  const { className: mainClassName = '', ...restMain } = mainProps ?? {};
  return (
    <Base kind="dark" className="flex flex-col">
      <SiteHeader className="px-6 pt-6 md:px-12 md:pt-8" hideSignIn={hideSignIn} />
      <main
        className={`mx-auto w-full px-6 pb-16 pt-10 md:px-12 ${WIDTH[width]} ${mainClassName}`.trim()}
        {...restMain}
      >
        {children}
      </main>
      {withFooter ? <SiteFooter /> : null}
    </Base>
  );
}
