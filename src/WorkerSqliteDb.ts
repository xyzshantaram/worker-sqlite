import { SqlParams, WorkerResponse } from "./types.ts";

interface StoredPromise {
    resolve: (val: unknown) => void;
    reject: (err: unknown) => void;
}

export class WorkerSqliteDb {
    worker: Worker;
    pendingQueries: Record<string, StoredPromise> = {};

    constructor(path: string) {
        const url = new URL("./worker.ts", import.meta.url);
        this.worker = new Worker(url.href, { type: "module" });

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
                    break;
                }
                default: {
                    throw new Error("Unknown message type received");
                }
            }
        }
    }

    query(query: string, ...params: SqlParams) {
        const id = crypto.randomUUID();
        this.worker.postMessage({
            type: 'query', data: { query, params, id }
        });

        return new Promise((resolve, reject) =>
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
}