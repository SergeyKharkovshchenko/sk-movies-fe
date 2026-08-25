<!--
	Manual verification page for the Sentry setup — equivalent to the wizard-generated
	/sentry-example-page, hand-written since we skipped the wizard (see hooks.client.ts).
	Not linked from the nav — diagnostic only, same as the BE's /test-gcp-logging endpoint.
-->
<script lang="ts">
	function throwTestError() {
		throw new Error('Sentry FE verification test error');
	}
</script>

<div class="flex flex-col items-center justify-center gap-4 p-16">
	<h1 class="text-xl font-semibold">Sentry verification</h1>
	<p class="text-sm text-zinc-600">
		Click the button, then check Sentry Issues for "Sentry FE verification test error".
	</p>
	<button
		class="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
		on:click={throwTestError}
	>
		Throw test error
	</button>
</div>
