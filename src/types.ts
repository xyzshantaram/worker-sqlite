import { RowObject } from "./deps.ts";

export type SqlParams = (string | number | boolean)[];

export interface WorkerResponse {
    type: 'InitResponse' | 'QueryResult' | 'ExecutionResponse',
    id: string;
    value?: RowObject[];
    message?: string;
}

export interface WorkerMessage {
    type: 'query' | 'init' | 'execute';
    data: {
        query?: string,
        path?: string,
        params?: SqlParams,
        id?: string
    }
}