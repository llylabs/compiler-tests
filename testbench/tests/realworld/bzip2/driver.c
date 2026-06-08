/* Driver for bzip2 library — compress/decompress round-trip. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* bzlib.h is already pulled in transitively via the wrapper includes. */

/* libbzip2's internal assertion path may resolve to bz_internal_error()
   depending on build flags — provide a real implementation so the brick
   doesn't end up with an unresolved env::bz_internal_error import. */
void bz_internal_error(int errcode) {
    fprintf(stderr, "bz_internal_error: %d\n", errcode);
    exit(3);
}

int main(void) {
    char in[256];
    char compressed[1024];
    char out[256];
    unsigned int comp_len = (unsigned int)sizeof(compressed);
    unsigned int out_len  = (unsigned int)sizeof(out);

    const char *msg = "Hello bzip2 round-trip test 1234567890 abcdefghij";
    unsigned int in_len = (unsigned int)strlen(msg);
    memcpy(in, msg, in_len);

    int rc = BZ2_bzBuffToBuffCompress(compressed, &comp_len, in, in_len, 9, 0, 0);
    if (rc != BZ_OK) { printf("FAIL compress rc=%d\n", rc); return 1; }

    rc = BZ2_bzBuffToBuffDecompress(out, &out_len, compressed, comp_len, 0, 0);
    if (rc != BZ_OK) { printf("FAIL decompress rc=%d\n", rc); return 1; }

    if (out_len != in_len || memcmp(in, out, in_len) != 0) {
        printf("FAIL mismatch: in_len=%u out_len=%u\n", in_len, out_len);
        return 1;
    }

    printf("OK bzip2 round-trip: in=%u comp=%u out=%u\n", in_len, comp_len, out_len);
    return 0;
}
