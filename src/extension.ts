// Document formatting with external commands like clang-format

import { spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

interface Formatter {
	command: string;
	args?: string[];
	languages: string[];
}

export function activate(context: vscode.ExtensionContext) {
	let registrations: vscode.Disposable[] = [];
	const update = () => {
		registrations.forEach((r) => r.dispose());
		registrations = formatters().map((formatter) =>
			vscode.languages.registerDocumentFormattingEditProvider(
				formatter.languages.map((l) => ({ language: l })),
				formattingProvider(formatter),
			),
		);
	};

	context.subscriptions.push(
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

function formatters(): Formatter[] {
	return vscode.workspace.getConfiguration('formatExt').get('formatters', []);
}

function formattingProvider(formatter: Formatter): vscode.DocumentFormattingEditProvider {
	return {
		async provideDocumentFormattingEdits(document, _options, token) {
			const text = document.getText();
			const args = (formatter.args ?? []).map((a) =>
				a.replaceAll('${file}', document.fileName),
			);
			// Working directory lets formatters find config like .clang-format
			const cwd =
				document.uri.scheme === 'file' ? path.dirname(document.uri.fsPath) : undefined;
			try {
				const formatted = await run(formatter.command, args, text, cwd, token);
				if (token.isCancellationRequested || formatted === text) {
					return [];
				}
				const range = document.validateRange(new vscode.Range(0, 0, document.lineCount, 0));
				return [vscode.TextEdit.replace(range, formatted)];
			} catch (error) {
				if (!token.isCancellationRequested) {
					void vscode.window.showErrorMessage(
						`${formatter.command} failed: ${(error as Error).message}`,
					);
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
		child.on('close', (code) =>
			code === 0 ? resolve(stdout) : reject(new Error(stderr.trim() || `exit code ${code}`)),
		);
		token.onCancellationRequested(() => child.kill());
		child.stdin.end(input);
	});
}
