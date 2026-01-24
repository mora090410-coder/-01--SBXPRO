
import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { GameState } from '../types';
import EmptyState from '../components/empty/EmptyState';
import { Trophy } from 'lucide-react';

interface Contest {
    id: string;
    title: string;
    created_at: string;
    settings: GameState;
}

const Dashboard: React.FC = () => {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [contests, setContests] = useState<Contest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        async function fetchContests() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('contests')
                    .select('id, title, created_at, settings')
                    .eq('owner_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setContests(data || []);
            } catch (err) {
                console.error('Error fetching contests:', err);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchContests();
        }
    }, [user]);

    const handleDelete = async (e: React.MouseEvent, contestId: string, contestTitle: string) => {
        e.preventDefault(); // Prevent navigation
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${contestTitle}"?\nThis action cannot be undone.`)) {
            return;
        }

        try {
            // 1. Delete from Supabase
            const { error } = await supabase
                .from('contests')
                .delete()
                .eq('id', contestId);

            if (error) throw error;

            // 2. Update local state
            setContests(current => current.filter(c => c.id !== contestId));
        } catch (err) {
            console.error('Error deleting contest:', err);
            alert('Failed to delete contest. Please try again.');
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#050505] text-white">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-[#9D2235] animate-spin"></div>
                    <p className="text-sm text-gray-400 font-medium tracking-wide">LOADING STADIUM...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-display mb-2">My Contests</h1>
                        <p className="text-body-secondary">Manage your football squares pools</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link to="/create" className="btn-cardinal text-button flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            New Contest
                        </Link>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* Create New Card (Mobile/Desktop Grid Item) */}
                    <Link to="/create" className="group relative aspect-video bg-[#1c1c1e]/40 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:bg-[#1c1c1e]/60 flex flex-col items-center justify-center gap-4 cursor-pointer">
                        <div className="w-16 h-16 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors border border-white/5 group-hover:scale-110 duration-300">
                            <Plus className="w-8 h-8 text-white/40 group-hover:text-white" strokeWidth={1.5} />
                        </div>
                        <span className="text-button text-gray-400 group-hover:text-white">Create New Pool</span>
                    </Link>

                    {contests.length === 0 && (
                        <div className="col-span-1 md:col-span-2 lg:col-span-2">
                            <EmptyState
                                variant="first-time"
                                title="No Contests Yet"
                                description="You haven't created any football squares pools yet. Start a new contest for the big game!"
                                action={{ label: "Create Your First Pool", to: "/create" }}
                                icon={<Trophy className="w-8 h-8 text-gold" strokeWidth={1.5} />}
                            />
                        </div>
                    )}

                    {contests.map(contest => (
                        <Link key={contest.id} to={`/?poolId=${contest.id}`} className="group relative aspect-video bg-[#1c1c1e] border border-white/10 rounded-2xl overflow-hidden hover:border-[#9D2235]/50 transition-all hover:shadow-2xl hover:shadow-[#9D2235]/10 flex flex-col">

                            {/* Cover Image or Gradient */}
                            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-900 to-black">
                                {contest.settings.coverImage ? (
                                    <img src={contest.settings.coverImage} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition-all duration-700" alt="Cover" />
                                ) : (
                                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#9D2235]/20 via-transparent to-transparent"></div>
                                )}

                                {/* Teams Badge */}
                                <div className="absolute top-4 left-4 flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-black/60 backdrop-blur border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white">
                                        {contest.settings.leftAbbr || 'UNK'} vs {contest.settings.topAbbr || 'UNK'}
                                    </span>
                                </div>

                                {/* Delete Button (Top Right) */}
                                <button
                                    onClick={(e) => handleDelete(e, contest.id, contest.title)}
                                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-red-500/20 text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/30 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 z-20"
                                    title="Delete Contest"
                                >
                                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* Footer Info */}
                            <div className="p-4 bg-[#1c1c1e] border-t border-white/5 relative z-10 group-hover:bg-[#252527] transition-colors">
                                <h3 className="text-base font-bold text-white truncate mb-1 group-hover:text-[#9D2235] transition-colors">{contest.title}</h3>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 font-medium">{new Date(contest.created_at).toLocaleDateString()}</span>
                                    <span className="text-[10px] uppercase font-bold text-[#9D2235] opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">Open Board &rarr;</span>
                                </div>
                            </div>

                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
