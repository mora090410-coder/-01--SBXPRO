import React from 'react';

interface SectionLoadingProps {
    height?: string | number;
    className?: string;
}

const SectionLoading: React.FC<SectionLoadingProps> = ({ height = '12rem', className = '' }) => {
    return (
        <div
            className={`w-full flex items-center justify-center bg-white/5 rounded-xl border border-white/5 ${className}`}
            style={{ height }}
        >
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-[3px] border-white/10 border-t-[#8F1D2C] animate-spin" />
                <span className="text-[10px] text-white/30 font-medium tracking-wide uppercase">Loading</span>
            </div>
        </div>
    );
};

export default SectionLoading;
