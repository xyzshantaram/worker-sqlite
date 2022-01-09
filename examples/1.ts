import { WorkerSqliteDb } from '../mod.ts';

const db = new WorkerSqliteDb('./test.db');

// set up the db
await db.execute('drop table if exists testing');
await db.execute('create table testing (name string, age number, is_ginger boolean)');

// insert some data
await db.execute('insert into testing(name, age, is_ginger) values(?, ?, ?)', 'Shawn', 19, false);
await db.execute('insert into testing(name, age, is_ginger) values(?, ?, ?)', 'Ron', 19, true);
await db.execute('insert into testing(name, age, is_ginger) values(?, ?, ?)', 'Dawn', 21, false);

for (const person of await db.query('select * from testing')) {
    console.log(person);
}

console.log('\n!!! Gingers only !!!\n');

for (const person of await db.query('select * from testing where is_ginger = 1')) {
    console.log(person);
}

db.close();