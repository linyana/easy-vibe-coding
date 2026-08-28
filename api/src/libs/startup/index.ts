import { createInterface } from 'readline';

async function confirm(question: string): Promise<boolean> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			rl.close();
			resolve(answer.trim().toLowerCase() === 'y');
		});
	});
}

async function findPidOnPort(port: number): Promise<number | null> {
	try {
		if (process.platform === 'win32') {
			const proc = Bun.spawn(['netstat', '-ano'], {
				stdout: 'pipe',
				stderr: 'pipe',
			});
			const output = await new Response(proc.stdout).text();
			// `:3000 ` (trailing space) so `:30000` doesn't false-positive.
			const line = output
				.split('\n')
				.find(
					(l) => l.includes(`:${port} `) && l.includes('LISTENING'),
				);
			if (!line) return null;
			const pid = parseInt(line.trim().split(/\s+/).pop()!, 10);
			return isNaN(pid) ? null : pid;
		}
		const proc = Bun.spawn(['lsof', '-ti', `:${port}`], {
			stdout: 'pipe',
			stderr: 'pipe',
		});
		const output = await new Response(proc.stdout).text();
		const pid = parseInt(output.trim().split('\n')[0]!, 10);
		return isNaN(pid) ? null : pid;
	} catch {
		return null;
	}
}

async function killByPid(pid: number): Promise<void> {
	if (process.platform === 'win32') {
		const proc = Bun.spawn(['taskkill', '/PID', String(pid), '/F'], {
			stdout: 'pipe',
			stderr: 'pipe',
		});
		await proc.exited;
	} else {
		process.kill(pid, 'SIGKILL');
	}
	await Bun.sleep(500);
}

/**
 * Frees the port before `app.listen`: if occupied, resolve the owning PID
 * (netstat on Windows / lsof elsewhere) and either ask to kill it (interactive
 * terminal) or kill it automatically (CI / piped stdout).
 *
 * `hostname` must match the real `listen` address — probing `::` misses a
 * process bound to `0.0.0.0` (distinct socket namespaces on Windows).
 */
export async function ensurePort({
	port,
	hostname,
}: {
	port: number;
	hostname: string;
}): Promise<void> {
	const net = await import('node:net');
	const inUse = await new Promise<boolean>((resolve) => {
		const server = net.createServer();
		server.once('error', () => resolve(true));
		server.once('listening', () => {
			server.close();
			resolve(false);
		});
		server.listen(port, hostname);
	});

	if (!inUse) return;

	const pid = await findPidOnPort(port);
	if (!pid) {
		console.error(
			`\x1b[31m[FATAL]\x1b[0m Port ${port} is occupied but could not find the PID`,
		);
		process.exit(1);
	}

	if (process.stdin.isTTY) {
		console.warn(
			`\x1b[33m[WARN]\x1b[0m Port ${port} is occupied by PID ${pid}`,
		);
		const yes = await confirm('  Kill it and retry? (y/N) ');
		if (!yes) process.exit(0);
	} else {
		console.warn(
			`\x1b[33m[WARN]\x1b[0m Port ${port} is occupied by PID ${pid}, killing automatically...`,
		);
	}

	await killByPid(pid);
}
