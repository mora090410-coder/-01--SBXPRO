import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, FileSearch, Trophy } from 'lucide-react';

interface EmptyStateProps {
    variant?: 'default' | 'first-time' | 'no-results' | 'error';
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick?: () => void;
        to?: string;
    };
    secondaryAction?: {
        label: string;
        onClick?: () => void;
    };
}

const EmptyState: React.FC<EmptyStateProps> = ({
    variant = 'default',
    title,
    description,
    icon,
    action,
    secondaryAction
}) => {
    // Defines styles based on variant
    const getVariantStyles = () => {
        switch (variant) {
            case 'error':
                return {
                    bg: 'bg-red-500/5',
                    border: 'border-red-500/20',
                    iconBg: 'bg-red-500/10',
                    iconColor: 'text-red-500',
                    titleColor: 'text-red-400'
                };
            case 'first-time':
                return {
                    bg: 'bg-surface-glass',
                    border: 'border-white/10',
                    iconBg: 'bg-white/5',
                    iconColor: 'text-gold',
                    titleColor: 'text-white'
                };
            case 'no-results':
            default:
                return {
                    bg: 'bg-transparent',
                    border: 'border-transparent',
                    iconBg: 'bg-white/5',
                    iconColor: 'text-text-secondary',
                    titleColor: 'text-text-secondary'
                };
        }
    };

    const styles = getVariantStyles();

    // Default icon based on variant if none provided
    const getDefaultIcon = () => {
        if (icon) return icon;

        switch (variant) {
            case 'error': return <AlertCircle className="w-8 h-8" strokeWidth={1.5} />;
            case 'no-results': return <FileSearch className="w-8 h-8 opacity-60" strokeWidth={1.5} />;
            case 'first-time': return <Trophy className="w-8 h-8" strokeWidth={1.5} />;
            default: return <FileSearch className="w-8 h-8 opacity-60" strokeWidth={1.5} />;
        }
    };

    return (
        <div className={`rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500 ${styles.bg} ${variant !== 'no-results' ? `border ${styles.border}` : ''}`}>

            {/* Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${styles.iconBg} ${styles.iconColor}`}>
                {getDefaultIcon()}
            </div>

            {/* Content */}
            <div className="max-w-md space-y-2 mb-8">
                <h3 className={`text-heading ${styles.titleColor}`}>
                    {title}
                </h3>
                <p className="text-body-secondary leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {action && (
                    action.to ? (
                        <Link
                            to={action.to}
                            className={`px-8 py-3 rounded-full text-button shadow-lg transition-transform hover:scale-105 active:scale-95 ${variant === 'error' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'btn-cardinal'}`}
                        >
                            {action.label}
                        </Link>
                    ) : (
                        <button
                            onClick={action.onClick}
                            className={`px-8 py-3 rounded-full text-button shadow-lg transition-transform hover:scale-105 active:scale-95 ${variant === 'error' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'btn-cardinal'}`}
                        >
                            {action.label}
                        </button>
                    )
                )}

                {secondaryAction && (
                    <button
                        onClick={secondaryAction.onClick}
                        className="px-6 py-3 rounded-full text-button text-gray-500 hover:text-white transition-colors"
                    >
                        {secondaryAction.label}
                    </button>
                )}
            </div>
        </div>
    );
};

export default EmptyState;
