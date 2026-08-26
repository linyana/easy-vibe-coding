const api = Bun.spawn(['bun', 'run', 'dev'], {
	cwd: 'api',
	stdin: 'inherit',
	stdout: 'inherit',
	stderr: 'inherit',
});

const app = Bun.spawn(['bun', 'run', 'dev'], {
	cwd: 'app',
	stdin: 'inherit',
	stdout: 'inherit',
	stderr: 'inherit',
});

const shutdown = () => {
	api.kill();
	app.kill();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await Promise.all([api.exited, app.exited]);
