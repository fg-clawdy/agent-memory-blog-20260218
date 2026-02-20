declare module 'better-sqlite3' {
  interface Database {
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }

  interface Statement {
    all(...params: any[]): any[];
    run(...params: any[]): { lastInsertRowid: number; changes: number };
  }

  export default function Database(filename: string): Database;
}