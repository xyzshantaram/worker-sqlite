# worker-sqlite

A deno module wrapping [`x/sqlite`](https://deno.land/x/sqlite) in a worker for
async operation.

## Usage

Import with

```ts
import { WorkerSqliteDb } from "https://deno.land/x/worker_sqlite@0.1.0/mod.ts";
```

Then create DB object, execute and query things!

```ts
const db = new WorkerSqliteDb("./example.db");
await db.query("select things from table"); // Returns an array of RowObjects, i.e. objects representing rows as sets of key-value pairs.
await db.execute("delete things from table where condition = ?", condition);
```

Finally, close the db.

```ts
// will throw an Error if there are pending queries!
await db.close();
```

## License

This module is free software under the [MIT License](LICENSE). Copyright © 2022
Siddharth Singh.
