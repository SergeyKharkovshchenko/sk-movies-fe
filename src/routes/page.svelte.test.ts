import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

describe('/+page.svelte', () => {
	test('should render page', () => {
		render(Page);
		expect(screen.getByText('Movies')).toBeInTheDocument();
	});
});
