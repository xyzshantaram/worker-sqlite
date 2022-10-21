import { DB } from "https://deno.land/x/sqlite@v3.2.0/mod.ts";
import { WorkerMessage } from "./types.ts";

const dis = self as unknown as Worker;

let db: DB;
let initialised = false;

dis.onmessage = (e: MessageEvent<WorkerMessage>) => {
    handleMessage(e.data);
};

const handleMessage = (contents: WorkerMessage) => {
    switch (contents.type) {
        case 'init': {
            if (initialised) throw new Error('Attempt to reinitialise DB');
            initialised = true;
            let message = 'ok';

            try {
                db = new DB(contents.data.path);
            }
            catch (e) {
                message = `err: ${e}`;
            }

            dis.postMessage({ type: 'InitResponse', message });
            break;
        }

        case 'query': {
            let value = null;
            let message = undefined;
            try {
                value = db.queryEntries(contents.data.query!, contents.data.params);
            }
            catch (e) {
                message = `${e}`;
            }

            dis.postMessage({ type: 'QueryResult', value, id: contents.data.id, message });
            break;
        }

        case 'execute': {
            let message = 'ok';
            try {
                db.query(contents.data.query!, contents.data.params);
            }
            catch (e) {
                message = `err: ${e}`;
            }

            dis.postMessage({ type: 'ExecutionResponse', id: contents.data.id, message });
            break;
        }

        case 'close': {
            db.close();
            dis.postMessage({ type: 'Closed' });
            break;
        }

        default:
            throw new Error(`unknown message type ${contents.type}`);
    }
}