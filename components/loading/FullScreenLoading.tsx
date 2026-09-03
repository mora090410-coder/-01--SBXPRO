import React from 'react';
import { Base, Eyebrow } from '../../src/design/primitives';

interface FullScreenLoadingProps {
    message?: string;
}

const FullScreenLoading: React.FC<FullScreenLoadingProps> = ({ message }) => {
    return (
        <Base kind="dark" className="fixed inset-0 z-[9999] flex items-center justify-center px-6">
            <div role="status" className="flex flex-col items-center gap-3 text-center">
                <Eyebrow>{message || 'GRIDONE'}</Eyebrow>
            </div>
        </Base>
    );
};

export default FullScreenLoading;
