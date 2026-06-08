/* Driver for SQLite — opens in-memory DB, runs CRUD, prints results.
   Demonstrates the full sqlite3 engine compiled to one brick. */
#include <stdio.h>
#include <string.h>

/* sqlite3.h is pulled in via sqlite3.c #include in wrapper.c (it includes the
   header itself).  We get all sqlite3_* symbols. */

/* SQLITE_OS_OTHER=1: the application must supply sqlite3_os_init() and
   sqlite3_os_end().  We register a minimal "stub" VFS that supports only
   what sqlite3MemdbInit() and :memory: databases need:
     - sqlite3_vfs_find(0) must return non-NULL (memdb reads pLower->szOsFile)
     - xRandomness / xSleep / xCurrentTime are called by SQLite core
     - xOpen is never reached for ":memory:" because SQLITE_DEFAULT_VFS=memdb
   Real file I/O is not needed — a `:memory:` DB never touches disk. */

#include <time.h>

static int stubRandomness(sqlite3_vfs *pVfs, int nByte, char *zOut) {
    (void)pVfs;
    /* Cheap deterministic-ish seed; SQLite uses it for sqlite3_randomness(),
       which the :memory:/CRUD/SELECT path tolerates being weak. */
    static unsigned int s = 0x12345678u;
    for (int i = 0; i < nByte; i++) {
        s = s * 1103515245u + 12345u;
        zOut[i] = (char)((s >> 16) & 0xFF);
    }
    return nByte;
}

static int stubSleep(sqlite3_vfs *pVfs, int microseconds) {
    (void)pVfs;
    /* No real sleep — SQLite only calls this on lock retry, which we never hit
       for :memory: databases. */
    (void)microseconds;
    return microseconds;
}

static int stubCurrentTime(sqlite3_vfs *pVfs, double *prNow) {
    (void)pVfs;
    /* SQLite Julian-day seconds since 4714-11-24 BC. Use real time(). */
    time_t t = time(NULL);
    *prNow = 2440587.5 + (double)t / 86400.0;
    return SQLITE_OK;
}

static int stubCurrentTimeInt64(sqlite3_vfs *pVfs, sqlite3_int64 *piNow) {
    (void)pVfs;
    time_t t = time(NULL);
    *piNow = (sqlite3_int64)((2440587.5 + (double)t / 86400.0) * 86400000.0);
    return SQLITE_OK;
}

static int stubGetLastError(sqlite3_vfs *pVfs, int nBuf, char *zBuf) {
    (void)pVfs; (void)nBuf; (void)zBuf;
    return 0;
}

/* These should never be called for :memory: but must be non-NULL. */
static int stubOpen(sqlite3_vfs *p, sqlite3_filename z, sqlite3_file *f, int fl, int *po) {
    (void)p; (void)z; (void)f; (void)fl; (void)po;
    return SQLITE_CANTOPEN;
}
static int stubDelete(sqlite3_vfs *p, const char *z, int s) { (void)p; (void)z; (void)s; return SQLITE_IOERR_DELETE; }
static int stubAccess(sqlite3_vfs *p, const char *z, int f, int *r) { (void)p; (void)z; (void)f; *r = 0; return SQLITE_OK; }
static int stubFullPathname(sqlite3_vfs *p, const char *z, int n, char *o) {
    (void)p;
    sqlite3_snprintf(n, o, "%s", z);
    return SQLITE_OK;
}

static sqlite3_vfs stub_vfs = {
    /* iVersion       */ 2,
    /* szOsFile       */ 0,         /* :memory: never opens a real file */
    /* mxPathname     */ 256,
    /* pNext          */ 0,
    /* zName          */ "stub",
    /* pAppData       */ 0,
    /* xOpen          */ stubOpen,
    /* xDelete        */ stubDelete,
    /* xAccess        */ stubAccess,
    /* xFullPathname  */ stubFullPathname,
    /* xDlOpen        */ 0,
    /* xDlError       */ 0,
    /* xDlSym         */ 0,
    /* xDlClose       */ 0,
    /* xRandomness    */ stubRandomness,
    /* xSleep         */ stubSleep,
    /* xCurrentTime   */ stubCurrentTime,
    /* xGetLastError  */ stubGetLastError,
    /* xCurrentTimeInt64 */ stubCurrentTimeInt64,
};

SQLITE_API int sqlite3_os_init(void) {
    /* Register stub as default. memdb is registered next by SQLite core and
       reads stub_vfs.szOsFile (0); when SQLITE_DEFAULT_VFS="memdb" is used,
       sqlite3_open(":memory:") routes through memdb instead of stub. */
    return sqlite3_vfs_register(&stub_vfs, /*makeDflt=*/1);
}
SQLITE_API int sqlite3_os_end(void) {
    return sqlite3_vfs_unregister(&stub_vfs);
}

static int rowCb(void *user, int argc, char **argv, char **colNames) {
    (void)user; (void)colNames;
    for (int i = 0; i < argc; i++) {
        printf("%s%s", i ? "|" : "row: ", argv[i] ? argv[i] : "NULL");
    }
    printf("\n");
    return 0;
}

int main(void) {
    sqlite3 *db = NULL;
    char *err = NULL;
    int rc;

    rc = sqlite3_initialize();
    if (rc != SQLITE_OK) {
        printf("FAIL init rc=%d errcode=%d errstr=%s\n",
               rc, sqlite3_errcode(NULL), sqlite3_errstr(rc));
        return 1;
    }

    rc = sqlite3_open(":memory:", &db);
    if (rc != SQLITE_OK) { printf("FAIL open: %s\n", sqlite3_errmsg(db)); return 1; }
    printf("OK open\n");

    rc = sqlite3_exec(db,
        "CREATE TABLE t(id INTEGER PRIMARY KEY, name TEXT, val REAL);"
        "INSERT INTO t VALUES (1,'alpha', 1.5);"
        "INSERT INTO t VALUES (2,'beta',  2.7);"
        "INSERT INTO t VALUES (3,'gamma', 3.14);",
        NULL, NULL, &err);
    if (rc != SQLITE_OK) { printf("FAIL ddl: %s\n", err); sqlite3_free(err); return 1; }
    printf("OK ddl\n");

    rc = sqlite3_exec(db, "SELECT id, name, val FROM t ORDER BY id;", rowCb, NULL, &err);
    if (rc != SQLITE_OK) { printf("FAIL select: %s\n", err); sqlite3_free(err); return 1; }
    printf("OK select\n");

    sqlite3_stmt *stmt;
    rc = sqlite3_prepare_v2(db, "SELECT sqlite_version()", -1, &stmt, NULL);
    if (rc == SQLITE_OK && sqlite3_step(stmt) == SQLITE_ROW) {
        printf("version: %s\n", sqlite3_column_text(stmt, 0));
    }
    sqlite3_finalize(stmt);

    sqlite3_close(db);
    printf("OK close\n");
    return 0;
}
