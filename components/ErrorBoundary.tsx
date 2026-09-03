import { Component, ErrorInfo, ReactNode } from 'react';
import { Base, CapsuleButton, Glass } from '../src/design/primitives';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <Base kind="dark" className="flex items-center justify-center p-4">
                    <Glass padding="lg" role="alert" className="w-full max-w-md flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <h2 className="font-display text-[28px] leading-[1.05] text-fg">GridOne needs to reload.</h2>
                            <p className="font-ui text-[15px] text-fg-2">The application encountered an unexpected state. Your saved board data has not been intentionally changed.</p>
                        </div>

                        {this.state.error && (
                            <div className="rounded-control border border-hairline bg-panel p-3 font-mono text-[11px] text-tone-cardinal text-left overflow-auto max-h-32">
                                {this.state.error.toString()}
                            </div>
                        )}

                        {/* Pre-existing recovery path: the React tree is already unmountable here. */}
                        <CapsuleButton
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={() => window.location.reload()}
                        >
                            Reload GridOne
                        </CapsuleButton>
                    </Glass>
                </Base>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
