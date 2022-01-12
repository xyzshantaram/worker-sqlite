# worker-sqlite

A deno module wrapping [`x/sqlite`](https://deno.land/x/sqlite) in a worker for
async operation.

**Note**: This library makes use of unstable APIs, and must be run with the
`--unstable` flag.

## Usage

Import with

```ts
import { WorkerSqliteDb } from "https://deno.land/x/worker_sqlite@0.1.0/mod.ts";
```

Then create a DB object, execute and query things!

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

### Write-ahead logging and using the `sqlite3` module

The `sqlite3` module is an alternative SQLite library for Deno, using the Deno
FFI instead of WASM to run SQLite. It supports write-ahead logging, and is thus
a better choice for applications that do a lot of writing to the DB. You can
enable the use of this module by passing a `backend` argument in the options to
the WorkerSqliteDb constructor.

```ts
const db = new WorkerSqliteDb("./example-2.db", {
  backend: "sqlite3",
});
```

## License

This module is free software under the [MIT License](LICENSE). Copyright © 2022
Siddharth Singh.
