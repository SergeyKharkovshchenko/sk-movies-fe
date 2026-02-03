/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: {
					50: 'rgb(var(--color-primary-50))',
					100: 'rgb(var(--color-primary-100))',
					200: 'rgb(var(--color-primary-200))',
					300: 'rgb(var(--color-primary-300))',
					400: 'rgb(var(--color-primary-400))',
					500: 'rgb(var(--color-primary-500))',
					900: 'rgb(var(--color-primary-900))',
					950: 'rgb(var(--color-primary-950))'
				},
				secondary: {
					50: 'rgb(var(--color-secondary-50))',
					100: 'rgb(var(--color-secondary-100))',
					200: 'rgb(var(--color-secondary-200))',
					300: 'rgb(var(--color-secondary-300))',
					400: 'rgb(var(--color-secondary-400))',
					500: 'rgb(var(--color-secondary-500))',
					900: 'rgb(var(--color-secondary-900))',
					950: 'rgb(var(--color-secondary-950))'
				}
			}
		},
		data: {
			checked: 'state~="checked"',
			unchecked: 'state~="unchecked"'
		}
	},
	plugins: [],
	safelist: ['grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4']
};
