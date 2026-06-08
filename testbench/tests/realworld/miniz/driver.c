/* Driver for miniz — compress/decompress round-trip test. */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/* miniz.h is pulled in via miniz.c #include in wrapper.c */

int main(void) {
    const char *msg =
        "miniz round-trip test "
        "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA "
        "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB "
        "0123456789 abcdefghijklmnopqrstuvwxyz";
    unsigned long in_len = (unsigned long)strlen(msg);

    unsigned char comp[1024];
    unsigned long comp_len = sizeof(comp);
    int rc = mz_compress(comp, &comp_len, (const unsigned char *)msg, in_len);
    if (rc != MZ_OK) {
        printf("FAIL compress rc=%d\n", rc);
        return 1;
    }

    unsigned char out[1024];
    unsigned long out_len = sizeof(out);
    rc = mz_uncompress(out, &out_len, comp, comp_len);
    if (rc != MZ_OK) {
        printf("FAIL uncompress rc=%d\n", rc);
        return 1;
    }

    if (out_len != in_len || memcmp(msg, out, in_len) != 0) {
        printf("FAIL mismatch: in=%lu out=%lu\n", in_len, out_len);
        return 1;
    }

    printf("OK miniz round-trip: in=%lu comp=%lu out=%lu\n", in_len, comp_len, out_len);
    return 0;
}
