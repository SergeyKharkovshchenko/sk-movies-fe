<!--
	Manual verification page for the logging/monitoring setup — one button per destination,
	each calling that system directly rather than going through the error-hook plumbing, so a
	pass/fail on one is never ambiguous about which system it's actually testing.
	Not linked from the nav — diagnostic only, same as the BE's /test-gcp-logging endpoint.
-->
<script lang="ts">
	import * as Sentry from '@sentry/sveltekit';
	import { logError } from '$lib/utils/logger';

	let beStatus = $state<'idle' | 'sent'>('idle');
	let sentryStatus = $state<'idle' | 'sent'>('idle');

	function sendToBe() {
		logError(new Error('BE/GCP verification test error'), { source: 'sentry-test-page' });
		beStatus = 'sent';
	}

	function sendToSentry() {
		Sentry.captureException(new Error('Sentry FE verification test error'));
		sentryStatus = 'sent';
	}
</script>

<div class="flex flex-col items-center justify-center gap-8 p-16">
	<h1 class="text-xl font-semibold">Logging verification</h1>

	<div class="flex flex-col items-center gap-2">
		<p class="text-sm text-zinc-600">
			Sends directly via <code>logError</code> → <code>POST /logs</code> on the BE. Check the Network
			tab for the request, then Cloud Logging for "BE/GCP verification test error".
		</p>
		<button class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" onclick={sendToBe}>
			Send test log to BE (GCP)
		</button>
		{#if beStatus === 'sent'}<span class="text-xs text-zinc-500">Sent — check Network/GCP.</span
			>{/if}
	</div>

	<div class="flex flex-col items-center gap-2">
		<p class="text-sm text-zinc-600">
			Sends directly via <code>Sentry.captureException</code>. Check Sentry Issues for "Sentry FE
			verification test error". If nothing shows up, check for a request to
			<code>*.sentry.io</code> in the Network tab — a blocked/missing one usually means a browser extension
			(ad/tracker blocker) is silently dropping it, not a code issue.
		</p>
		<button class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700" onclick={sendToSentry}>
			Send test event to Sentry
		</button>
		{#if sentryStatus === 'sent'}<span class="text-xs text-zinc-500"
				>Sent — check Network/Sentry.</span
			>{/if}
	</div>
</div>
