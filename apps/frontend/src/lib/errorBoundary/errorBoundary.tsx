import React from "react";

interface Props {
	children: React.ReactNode;
	fallback: React.ComponentType<{ error?: Error }>;
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
	hasError: boolean;
	error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.props.onError?.(error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			const Fallback = this.props.fallback;
			return <Fallback error={this.state.error} />;
		}
		return this.props.children;
	}
}
