// Document formatting with external commands like clang-format

import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

const log = vscode.window.createOutputChannel('FormatExt', { log: true });

export function activate(context: vscode.ExtensionContext) {
	let registrations: vscode.Disposable[] = [];
	const update = () => {
		registrations.forEach((r) => r.dispose());
		registrations = [];
		// Formatters like Prettier run code from workspace config
		if (!vscode.workspace.isTrusted) {
			log.info('Formatting off in Restricted Mode');
			return;
		}
		registrations = Object.entries(formatters()).map(([command, endings]) =>
			vscode.languages.registerDocumentFormattingEditProvider(
				endings
					.split(',')
					.map((e) => e.trim())
					.filter(Boolean)
					.map((e) => ({ pattern: `**/*${e}` })),
				formattingProvider(command),
			),
		);
	};

	context.subscriptions.push(
		log,
		vscode.workspace.onDidChangeConfiguration((event) => {
			if (event.affectsConfiguration('formatExt')) {
				update();
			}
		}),
		vscode.workspace.onDidGrantWorkspaceTrust(update),
		{ dispose: () => registrations.forEach((r) => r.dispose()) },
	);
	update();
}

/** File endings like `.glsl,.gdshaderinc` per formatter command line */
function formatters(): Record<string, string> {
	return vscode.workspace.getConfiguration('formatExt').get('formatters', {});
}

function formattingProvider(commandLine: string): vscode.DocumentFormattingEditProvider {
	return {
		async provideDocumentFormattingEdits(document, _options, token) {
			const text = document.getText();
			const [command, ...args] = commandLine
				.trim()
				.split(/\s+/)
				.map((a) => a.replaceAll('${file}', document.fileName));
			// Working directory lets formatters find config like .clang-format
			const cwd =
				document.uri.scheme === 'file' ? path.dirname(document.uri.fsPath) : undefined;
			log.info(`Run ${[command, ...args].join(' ')}`);
			try {
				const formatted = await run(command, args, text, cwd, token);
				if (token.isCancellationRequested) {
					log.info('Cancelled');
					return [];
				}
				if (formatted === text) {
					log.info('No changes');
					return [];
				}
				log.info('Formatted');
				const range = document.validateRange(new vscode.Range(0, 0, document.lineCount, 0));
				return [vscode.TextEdit.replace(range, formatted)];
			} catch (error) {
				if (token.isCancellationRequested) {
					log.info('Cancelled');
					return [];
				}
				if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
					log.warn(`${command} not found in PATH ${process.env.PATH}`);
				} else {
					log.error(`[${path.basename(command)}] ${(error as Error).message}`);
				}
				return [];
			}
		},
	};
}

/** Pipe input through command */
function run(
	command: string,
	args: string[],
	input: string,
	cwd: string | undefined,
	token: vscode.CancellationToken,
): Promise<string> {
	return new Promise((resolve, reject) => {
		const child = spawn(command, args, { cwd });
		let stdout = '';
		let stderr = '';
		child.stdout.setEncoding('utf8').on('data', (chunk: string) => (stdout += chunk));
		child.stderr.setEncoding('utf8').on('data', (chunk: string) => (stderr += chunk));
		child.on('error', reject);
		child.stdin.on('error', reject);
		child.on('close', (code) => {
			// Formatters like Prettier tag each line with its level
			const output = stderr.trim().replace(/^\[(error|warn|warning|info|debug)\] ?/gm, '');
			if (code !== 0) {
				reject(new Error(output || `exit code ${code}`));
				return;
			}
			if (output) {
				log.warn(`[${path.basename(command)}] ${output}`);
			}
			resolve(stdout);
		});
		token.onCancellationRequested(() => child.kill());
		child.stdin.end(input);
	});
}
