/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export function getLoadedMonaco(): typeof monaco {
	if (!monaco) {
		throw new Error("monaco is not loaded yet");
	}
	return monaco;
}

export function getMonaco(): typeof monaco | undefined {
	return (window as any).monaco;
}

export interface IMonacoSetup {
	loaderUrl: string;
	loaderConfigPaths: Record<string, string>;
	codiconUrl: string;
	monacoTypesUrl: string | undefined;
}

let loadMonacoPromise: Promise<typeof monaco> | undefined;
export async function loadMonaco(
	setup: IMonacoSetup = prodMonacoSetup
): Promise<typeof monaco> {
	if (!loadMonacoPromise) {
		loadMonacoPromise = _loadMonaco(setup);
	}
	return loadMonacoPromise;
}

async function _loadMonaco(setup: IMonacoSetup): Promise<typeof monaco> {
	const global = self as any;

	if (!(global as any).require) {
		await loadScript(setup.loaderUrl);
	}

	global.AMD = true;
	global.getCodiconPath = () => {
		return setup.codiconUrl;
	};

	/** @type {any} */
	const req = global.require as any;
	req.config({ paths: setup.loaderConfigPaths });

	return new Promise((res) => {
		// First load editor.main. If it inlines the plugins, we don't want to try to load them from the server.
		req(["vs/editor/editor.main"], () => {
			req(
				[
					"vs/basic-languages/monaco.contribution",
					"vs/language/css/monaco.contribution",
					"vs/language/html/monaco.contribution",
					"vs/language/json/monaco.contribution",
					"vs/language/typescript/monaco.contribution",
				],
				() => {
					res(monaco);
				}
			);
		});
	});
}

function loadScript(path: string): Promise<void> {
	return new Promise((res) => {
		const script = document.createElement("script");
		script.onload = () => res();
		script.async = true;
		script.type = "text/javascript";
		script.src = path;
		document.head.appendChild(script);
	});
}

export const prodMonacoSetup = getMonacoSetup(
	"node_modules/monaco-editor/min/vs"
);

export function getMonacoSetup(corePath: string): IMonacoSetup {
	const loaderConfigPaths = {
		vs: `${corePath}`,
	};

	return {
		loaderUrl: `${corePath}/loader.js`,
		loaderConfigPaths,
		codiconUrl: `${corePath}/base/browser/ui/codicons/codicon/codicon.ttf`,
		monacoTypesUrl: undefined,
	};
}
