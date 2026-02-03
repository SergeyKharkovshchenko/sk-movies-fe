// Core event types that React.ChangeEvent builds upon
interface SyntheticEvent<T = Element> {
	bubbles?: boolean;
	cancelable?: boolean;
	defaultPrevented?: boolean;
	eventPhase?: number;
	isTrusted?: boolean;
	nativeEvent?: Event;
	preventDefault(): void;
	stopPropagation(): void;
	target: EventTarget;
	type: string;
}

// The actual ChangeEvent interface from React
export interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
	target: EventTarget & T;
}
