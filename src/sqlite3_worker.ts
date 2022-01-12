import { Database } from './deps.ts';
import { WorkerMessage } from "./types.ts";

const dis = self as unknown as Worker;

let db: Database;
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
                db = new Database(contents.data.path!);
                db.execute('pragma journal_mode = wal');
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
                value = db.queryObject(contents.data.query!, ...contents.data.params);
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
                db.execute(contents.data.query!, ...contents.data.params);
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