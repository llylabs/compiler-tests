#include <stdio.h>
#include "sqlite3.h"

int main() {
    sqlite3 *db;
    char *err_msg = 0;
    int rc;

    // Manual init required with SQLITE_OMIT_AUTOINIT
    rc = sqlite3_initialize();
    if (rc != SQLITE_OK) {
        printf("FAIL: sqlite3_initialize: %d\n", rc);
        return 1;
    }

    rc = sqlite3_open(":memory:", &db);
    if (rc != SQLITE_OK) {
        printf("FAIL: Cannot open database: %s\n", sqlite3_errmsg(db));
        return 1;
    }
    printf("OK: Database opened\n");

    rc = sqlite3_exec(db, "CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT, value REAL)", 0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        printf("FAIL: SQL error: %s\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(db);
        return 1;
    }
    printf("OK: Table created\n");

    rc = sqlite3_exec(db,
        "INSERT INTO test VALUES (1, 'alpha', 1.5);"
        "INSERT INTO test VALUES (2, 'beta', 2.7);"
        "INSERT INTO test VALUES (3, 'gamma', 3.14);",
        0, 0, &err_msg);
    if (rc != SQLITE_OK) {
        printf("FAIL: Insert error: %s\n", err_msg);
        sqlite3_free(err_msg);
        sqlite3_close(db);
        return 1;
    }
    printf("OK: Data inserted\n");

    sqlite3_stmt *stmt;
    rc = sqlite3_prepare_v2(db, "SELECT 1+1", -1, &stmt, 0);
    if (rc == SQLITE_OK && sqlite3_step(stmt) == SQLITE_ROW) {
        printf("SELECT 1+1 = %d\n", sqlite3_column_int(stmt, 0));
    }
    sqlite3_finalize(stmt);

    rc = sqlite3_prepare_v2(db, "SELECT id, name, value FROM test ORDER BY id", -1, &stmt, 0);
    if (rc == SQLITE_OK) {
        while (sqlite3_step(stmt) == SQLITE_ROW) {
            printf("Row: id=%d name=%s value=%.2f\n",
                   sqlite3_column_int(stmt, 0),
                   sqlite3_column_text(stmt, 1),
                   sqlite3_column_double(stmt, 2));
        }
    }
    sqlite3_finalize(stmt);

    printf("SQLite version: %s\n", sqlite3_libversion());
    sqlite3_close(db);
    printf("OK: Done\n");
    return 0;
}
