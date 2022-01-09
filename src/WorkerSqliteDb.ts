// deno-lint-ignore-file no-explicit-any
import { RowObject } from "./deps.ts";
import { SqlParams, WorkerResponse } from "./types.ts";

interface StoredPromise {
    resolve: (val: any) => void;
    reject: (err: any) => void;
}

export class WorkerSqliteDb {
    worker: Worker;
    pendingQueries: Record<string, StoredPromise> = {};
    closed = false;

    constructor(path: string) {
        const url = new URL("./worker.ts", import.meta.url);
        this.worker = new Worker(url.href, {
            type: "module",
            deno: {
                namespace: true,
                permissions: {
                    read: true,
                    write: true
                }
            }
        });

        this.worker.postMessage({
            type: 'init',
            data: {
                path
            }
        })

        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const contents = e.data;

            switch (contents.type) {
                case "QueryResult": {
                    const query = this.pendingQueries[contents.id];
                    if (contents.value === null) {
                        query.reject(contents.message);
                    }
                    else {
                        query.resolve(contents.value);
                    }
                    delete this.pendingQueries[contents.id];
                    break;
                }
                case "InitResponse":
                    if (contents.message !== 'ok') {
                        throw new Error('Could not initialise worker!');
                    }
                    break;
                case "ExecutionResponse": {
                    const query = this.pendingQueries[contents.id];
                    if (contents.message !== 'ok') {
                        query.reject(contents.message);
                    }
                    else {
                        query.resolve(undefined);
                    }
                    delete this.pendingQueries[contents.id];
                    break;
                }
                case "Closed": {
                    this.closed = true;
                    this.worker.terminate();
                    break;
                }
                default: {
                    throw new Error("Unknown message type received");
                }
            }
        }
    }

    query(query: string, ...params: SqlParams) {
        if (this.closed) throw new Error('Attempt to query closed DB');
        const id = crypto.randomUUID();
        this.worker.postMessage({
            type: 'query', data: { query, params, id }
        });

        return new Promise<RowObject[]>((resolve, reject) =>
            this.pendingQueries[id] = { resolve, reject }
        );
    }

    execute(query: string, ...params: SqlParams) {
        const id = crypto.randomUUID();
        this.worker.postMessage({
            type: 'execute', data: { query, params, id }
        });

        return new Promise((resolve, reject) =>
            this.pendingQueries[id] = { resolve, reject }
        );
    }

    close() {
        if (this.closed) throw new Error('Attempt to re-close DB');
        if (Object.keys(this.pendingQueries).length != 0) throw new Error('Attempt to close DB with pending queries');
        this.worker.postMessage({
            type: 'close'
        });
    }
}