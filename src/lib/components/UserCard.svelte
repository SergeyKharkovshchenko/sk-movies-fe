<script lang="ts">
	type User = { userId: string | number; numberOfReviews: number }
	let { user }: { user: User } = $props()
</script>

<div class="flex flex-col items-center gap-3 rounded-md border border-primary-500 px-4 py-6">
	<div class="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white">
		<i class="fa-solid fa-user text-xl"></i>
	</div>
	<div class="text-center">
		<div class="font-semibold text-zinc-950">User #{user.userId}</div>
		<div class="mt-1 text-sm text-primary-500">{user.numberOfReviews} reviews</div>
	</div>
</div>
