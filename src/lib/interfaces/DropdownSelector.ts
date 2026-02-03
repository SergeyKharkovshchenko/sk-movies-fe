export interface DropdownSelector {
	disabled?: boolean;
	options: { text: string; value: string; disabled?: boolean }[];
	defaultValue?: { text: string; value: string };
	label?: string;
	name?: string;
	icon?: string;
	required?: boolean;
	class?: string;
	selected?: { text: string; value: string };
	onChange?: (event: { name: string; text: string; value: string }) => void;
	error?: string | string[] | null;
	tooltipInfo?: string;
}
