import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import { PageMetadata } from '../components/seo/PageMetadata';
import { ArticleCTA } from '../components/seo/ArticleCTA';

export const RunYourPoolAlternative: React.FC = () => {
    const title = 'RunYourPool Alternative for Football Squares | GridOne';
    const description = 'Compare GridOne with broader pool platforms when you mainly need a football-squares board, readable mobile viewing, and one share link.';

    return (
        <div className="oa-root min-h-screen bg-broadcast-white text-ink font-sans selection:bg-gold/30 flex flex-col overflow-x-hidden">
            <PageMetadata
                title={title}
                description={description}
                path="/articles/run-your-pool-alternative"
                type="article"
                schema={{
                    '@type': 'Article',
                    headline: title,
                    description,
                    mainEntityOfPage: 'https://www.getgridone.com/articles/run-your-pool-alternative',
                    author: { '@type': 'Organization', name: 'GridOne' },
                    publisher: { '@type': 'Organization', name: 'GridOne', logo: { '@type': 'ImageObject', url: 'https://www.getgridone.com/icons/gridone-icon-256.png' } },
                    mainEntity: [
                        {
                            '@type': 'Question',
                            name: 'What is the best RunYourPool alternative for football squares?',
                            acceptedAnswer: { '@type': 'Answer', text: 'The best RunYourPool alternative depends on the pool you are running. GridOne is built for football squares organizers who want a mobile-first board, live scoring, simple sharing, and no account requirement for players viewing the board.' },
                        },
                        {
                            '@type': 'Question',
                            name: 'Can players view a GridOne football squares board without logging in?',
                            acceptedAnswer: { '@type': 'Answer', text: 'Yes. Players can open a shared GridOne board link without creating an account, which makes it easier to share a football squares board with friends, coworkers, parents, or supporters.' },
                        },
                    ],
                }}
            />
            <Header />
            <main className="mx-auto w-full max-w-4xl px-5 py-24 duration-700">

                <div className="mb-8 inline-flex items-center gap-2 rounded-control bg-newsprint px-3 py-1 text-xs text-gold ring-1 ring-gold/20">
                    Comparison Guide
                </div>

                <h1 className="oa-chyron text-4xl font-semibold tracking-tight md:text-5xl lg:text-6xl text-ink mb-6">
                    A focused <span className="text-cardinal">RunYourPool alternative</span> for football squares
                </h1>

                <p className="text-xl text-ink/70 mb-12 leading-relaxed">
                    If your group mainly needs one readable football-squares board link, a focused tool may fit better than a broad pool platform.
                </p>

                <article className="prose prose-lg max-w-none">
                    <h2 className="oa-headline text-2xl font-semibold text-ink mt-12 mb-6">When a focused board fits better</h2>
                    <p className="text-ink/80 leading-relaxed mb-6">
                        Broader pool platforms support many formats. GridOne stays focused on football squares: the organizer builds one board, shares one link, and viewers follow it without creating accounts.
                    </p>

                    <div className="my-12 grid gap-6 md:grid-cols-2">
                        <div className="rounded-surface bg-newsprint p-6 ring-1 ring-gold/20">
                            <h3 className="text-xl font-bold text-gold mb-4">GridOne for football squares</h3>
                            <ul className="space-y-3 text-sm text-ink/80">
                                <li className="flex items-center gap-2">✓ <strong>Free to build</strong> your board before you publish</li>
                                <li className="flex items-center gap-2">✓ <strong>Score checks:</strong> Updates about every minute with source and freshness shown</li>
                                <li className="flex items-center gap-2">✓ <strong>Next-score view:</strong> See which squares match common scoring plays</li>
                                <li className="flex items-center gap-2">✓ <strong>Mobile board:</strong> Readable on phones</li>
                                <li className="flex items-center gap-2">✓ <strong>No viewer login:</strong> People open the shared link directly</li>
                            </ul>
                        </div>

                        <div className="rounded-surface bg-newsprint p-6 ring-1 ring-white/10 opacity-70">
                            <h3 className="text-xl font-bold text-ink/80 mb-4">Broader pool platforms</h3>
                            <ul className="space-y-3 text-sm text-ink/60">
                                <li className="flex items-center gap-2">• May support more sports and pool formats than you need</li>
                                <li className="flex items-center gap-2">• May require more setup for a single squares board</li>
                                <li className="flex items-center gap-2">• May include features unrelated to football squares</li>
                                <li className="flex items-center gap-2">• Mobile and viewer-account experiences vary by platform</li>
                            </ul>
                        </div>
                    </div>

                    <h2 className="oa-headline text-2xl font-semibold text-ink mt-12 mb-6">See what the next score changes</h2>
                    <p className="text-ink/80 leading-relaxed mb-6">
                        GridOne shows which squares match common next scoring plays. During the game, viewers can answer questions like <em>"What changes if they kick a field goal here?"</em> without asking the organizer.
                    </p>
                    <p className="text-ink/80 leading-relaxed mb-8">
                        GridOne calculates this from the current displayed score and puts it beside the board. Every score shows where it came from and when, and the organizer can enter scores directly at any time.
                    </p>

                    <h2 className="oa-headline text-2xl font-semibold text-ink mt-12 mb-6">Who GridOne is best for</h2>
                    <p className="text-ink/80 leading-relaxed mb-6">
                        GridOne fits organizers who care most about football squares: a clean board link, readable mobile layout, live scoring, and fast sharing with people who do not want another account just to check their square.
                    </p>

                    <h2 className="oa-headline text-2xl font-semibold text-ink mt-12 mb-6">When a legacy pool platform may still fit</h2>
                    <p className="text-ink/80 leading-relaxed mb-8">
                        If you need a broad office-pool suite across many different sports formats, a larger legacy platform may still be the right tool. If your job is to run a football squares board that people can actually follow during the game, GridOne is focused on that experience.
                    </p>

                    <div className="mt-16 text-center">
                        <Link to="/create" className="inline-flex items-center justify-center gap-2 rounded-control bg-cardinal px-8 py-4 text-lg font-semibold text-broadcast-white hover:bg-cardinal-deep transition-all active:scale-95">
                            Create your free board
                        </Link>
                        <p className="mt-4 text-sm text-ink/50">Your first published board is free. Game Day is $9.99 once for up to 5 published boards in the 2026 season. Organization is $79 per season for up to 50 published boards.</p>
                    </div>

                    <ArticleCTA
                        title="Related guides"
                        links={[
                            { to: '/articles/digital-football-squares-board-vs-paper', label: 'Digital vs Paper Board', primary: true },
                            { to: '/articles/how-to-run-super-bowl-squares', label: 'How to run Super Bowl squares' },
                            { to: '/articles/football-squares-fundraiser', label: 'Fundraiser use cases' },
                        ]}
                    />
                </article>
            </main>
        </div>
    );
};
