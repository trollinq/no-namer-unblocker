import { Request, Response, writeResponse } from './AbstractMessage.js';
import type { JSONDatabaseAdapter } from './Meta.js';
import type { BareHeaders, BareRemote } from './requestUtil.js';
import createHttpError from 'http-errors';
import type { LookupOneOptions } from 'node:dns';
import EventEmitter from 'node:events';
import { readFileSync } from 'node:fs';
import type {
	Agent as HttpAgent,
	IncomingMessage,
	ServerResponse,
} from 'node:http';
import type { Agent as HttpsAgent } from 'node:https';
import { join } from 'node:path';
import type { Duplex } from 'node:stream';

export interface BareErrorBody {
	code: string;
	id: string;
	message?: string;
	stack?: string;
}

export class BareError extends Error {
	status: number;
	body: BareErrorBody;
	constructor(status: number, body: BareErrorBody) {
		super(body.message || body.code);
		this.status = status;
		this.body = body;
	}
}

export const pkg = JSON.parse(
	readFileSync(join(__dirname, '..', 'package.json'), 'utf-8')
) as { version: string };

const project: BareProject = {
	name: 'bare-server-node',
	description: 'TOMPHTTP NodeJS Bare Server',
	repository: 'https://github.com/tomphttp/bare-server-node',
	version: pkg.version,
};

export function json<T>(status: number, json: T) {
	const send = Buffer.from(JSON.stringify(json, null, '\t'));

	return new Response(send, {
		status,
		headers: {
			'content-type': 'application/json',
			'content-length': send.byteLength.toString(),
		},
	});
}

export type BareMaintainer = {
	email?: string;
	website?: string;
};

export type BareProject = {
	name?: string;
	description?: string;
	email?: string;
	website?: string;
	repository?: string;
	version?: string;
};

export type BareLanguage =
	| 'NodeJS'
	| 'ServiceWorker'
	| 'Deno'
	| 'Java'
	| 'PHP'
	| 'Rust'
	| 'C'
	| 'C++'
	| 'C#'
	| 'Ruby'
	| 'Go'
	| 'Crystal'
	| 'Shell'
	| string;

export type BareManifest = {
	maintainer?: BareMaintainer;
	project?: BareProject;
	versions: string[];
	language: BareLanguage;
	memoryUsage?: number;
};

export interface Options {
	logErrors: boolean;
	/**
	 * Callback for filtering the remote URL.
	 * @param remote
	 * @returns Nothing
	 * @throws An error if the remote is bad.
	 */
	filterRemote?: (remote: BareRemote) => Promise<void> | void;
	/**
	 * DNS lookup
	 * May not get called when remote.host is an IP
	 * Use in combination with filterRemote to block IPs
	 */
	lookup: (
		hostname: string,
		options: LookupOneOptions,
		callback: (
			err: NodeJS.ErrnoException | null,
			address: string,
			family: number
		) => void
	) => void;
	localAddress?: string;
	family?: number;
	maintainer?: BareMaintainer;
	httpAgent: HttpAgent;
	httpsAgent: HttpsAgent;
	database: JSONDatabaseAdapter;
}

export type RouteCallback = (
	request: Request,
	response: ServerResponse<IncomingMessage>,
	options: Options
) => Promise<Response> | Response;

export type SocketRouteCallback = (
	request: Request,
	socket: Duplex,
	head: Buffer,
	options: Options
) => Promise<void> | void;

export default class Server extends EventEmitter {
	routes = new Map<string, RouteCallback>();
	socketRoutes = new Map<string, SocketRouteCallback>();
	private closed = false;
	private directory: string;
	private options: Options;
	/**
	 * @internal
	 */
	constructor(directory: string, options: Options) {
		super();
		this.directory = directory;
		this.options = options;
	}
	/**
	 * Remove all timers and listeners
	 */
	close() {
		this.closed = true;
		this.emit('close');
	}
	shouldRoute(request: IncomingMessage): boolean {
		return (
			!this.closed &&
			request.url !== undefined &&
			request.url.startsWith(this.directory)
		);
	}
	get instanceInfo(): BareManifest {
		return {
			versions: ['v1', 'v2'],
			language: 'NodeJS',
			memoryUsage:
				Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
			maintainer: this.options.maintainer,
			project,
		};
	}
	async routeUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
		const request = new Request(req, {
			method: req.method!,
			path: req.url!,
			headers: <BareHeaders>req.headers,
		});

		const service = request.url.pathname.slice(this.directory.length - 1);

		if (this.socketRoutes.has(service)) {
			const call = this.socketRoutes.get(service)!;

			try {
				await call(request, socket, head, this.options);
			} catch (error) {
				if (this.options.logErrors) {
					console.error(error);
				}

				socket.end();
			}
		} else {
			socket.end();
		}
	}
	async routeRequest(req: IncomingMessage, res: ServerResponse) {
		const request = new Request(req, {
			method: req.method!,
			path: req.url!,
			headers: <BareHeaders>req.headers,
		});

		const service = request.url.pathname.slice(this.directory.length - 1);
		let response: Response;

		try {
			if (request.method === 'OPTIONS') {
				response = new Response(undefined, { status: 200 });
			} else if (service === '/') {
				response = json(200, this.instanceInfo);
			} else if (this.routes.has(service)) {
				const call = this.routes.get(service)!;
				response = await call(request, res, this.options);
			} else {
				throw new createHttpError.NotFound();
			}
		} catch (error) {
			if (this.options.logErrors) console.error(error);

			if (createHttpError.isHttpError(error)) {
				response = json(error.statusCode, {
					code: 'UNKNOWN',
					id: `error.${error.name}`,
					message: error.message,
					stack: error.stack,
				});
			} else if (error instanceof Error) {
				response = json(500, {
					code: 'UNKNOWN',
					id: `error.${error.name}`,
					message: error.message,
					stack: error.stack,
				});
			} else {
				response = json(500, {
					code: 'UNKNOWN',
					id: 'error.Exception',
					message: error,
					stack: new Error(<string | undefined>error).stack,
				});
			}

			if (!(response instanceof Response)) {
				if (this.options.logErrors) {
					console.error(
						'Cannot',
						request.method,
						request.url.pathname,
						': Route did not return a response.'
					);
				}

				throw new createHttpError.InternalServerError();
			}
		}

		response.headers.set('x-robots-tag', 'noindex');
		response.headers.set('access-control-allow-headers', '*');
		response.headers.set('access-control-allow-origin', '*');
		response.headers.set('access-control-allow-methods', '*');
		response.headers.set('access-control-expose-headers', '*');
		// don't fetch preflight on every request...
		// instead, fetch preflight every 10 minutes
		response.headers.set('access-control-max-age', '7200');

		writeResponse(response, res);
	}
}
