import { Database } from "https://deno.land/x/sqlite3@0.6.1/mod.ts";
import { WorkerMessage } from "./types.ts";

const dis = self as unknown as Worker;

let db: Database;
let initialised = false;

dis.onmessage = (e: MessageEvent<WorkerMessage>) => {
    handleMessage(e.data);
};

console.warn('This library currently doesn\'t work with sqlite3. Apologies.');

const handleMessage = (contents: WorkerMessage) => {
    switch (contents.type) {
        case 'init': {
            if (initialised) throw new Error('Attempt to reinitialise DB');
            initialised = true;
            let message = 'ok';

            try {
                db = new Database(contents.data.path!);
                db.exec('pragma journal_mode = wal');
            }
            catch (e) {
                message = `err: ${e}`;
            }

            dis.postMessage({ type: 'InitResponse', message });
            break;
        }

        case 'query': {
            contents.data.params = contents.data.params || [];
            let value = null;
            let message = undefined;
            try {
                value = db.prepare(contents.data.query!).all(...contents.data.params!);
            }
            catch (e) {
                message = `${e}`;
            }

            dis.postMessage({ type: 'QueryResult', value, id: contents.data.id, message });
            break;
        }

        case 'execute': {
            contents.data.params = contents.data.params || [];
            let message = 'ok';
            try {
                db.prepare(contents.data.query!).run(...contents.data.params);
            }
            catch (e) {
                console.log('here');
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