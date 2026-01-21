import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    rounded?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    width = '100%',
    height = '1rem',
    rounded = 'rounded-md'
}) => {
    return (
        <div
            className={`relative overflow-hidden bg-white/5 ${rounded} ${className}`}
            style={{ width, height }}
        >
            {/* Shimmer Effect */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent shadow-none" />
        </div>
    );
};

export default Skeleton;
