// Regenerate the app's route tree before the vite-plus check gate, so a newly
// added route file can never be silently missing at runtime or in type-check.
// `bun run check` (and `check:fix`) stay a single command that always sees a
// fresh tree — no manual `tsr generate` step to remember.
const gen = Bun.spawn(['bunx', 'tsr', 'generate'], {
	cwd: 'app',
	stdin: 'inherit',
	stdout: 'inherit',
	stderr: 'inherit',
});
const genExit = await gen.exited;
if (genExit !== 0) process.exit(genExit);

const vpArgs = ['bunx', 'vp', 'check'];
if (process.argv.includes('--fix')) vpArgs.push('--fix');
vpArgs.push('app', 'api', 'packages');

const check = Bun.spawn(vpArgs, {
	stdin: 'inherit',
	stdout: 'inherit',
	stderr: 'inherit',
});
process.exit(await check.exited);
