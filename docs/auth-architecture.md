# Auth Architecture — How CI authenticates without secrets

This page explains how our public CI authenticates to RC
(rc.lilylabs.io) to download plugins, without storing any
secret in the public repository.

## TL;DR

GitHub Actions hands the workflow a short-lived signed JWT
that proves which repository + branch is currently running.
The workflow sends that JWT to RC. RC verifies it against
GitHub's public signing keys and grants plugin download
access only if the claims match.

**Nothing secret lives in the repo.** Forks cannot
impersonate us because GitHub puts the actual repo name
into the JWT.

## Why not just make plugins public?

A reasonable question. Plugins are binaries, they're not
"secret" in the cryptographic sense. But there are good
reasons to keep them auth-gated:

- **License control.** Distribution channel matters for
  the license terms we offer (the published install requires
  account creation; anonymous access would bypass that).
- **Usage telemetry.** Knowing which plugin versions are
  pulled, when, and by whom helps prioritize fixes.
- **Waitlist gating.** The platform has a waitlist; making
  plugins anonymous would bypass it.

OIDC lets us serve the public CI without compromising any
of these.

## The trust chain

```
GitHub Actions OIDC Provider (signs JWTs)
         │
         │ HTTPS, signature with GitHub's private key
         ▼
JWT contains:
  iss: https://token.actions.githubusercontent.com
  sub: repo:llylabs/compiler-tests:ref:refs/heads/main
  aud: rc.lilylabs.io
  exp: now + 5 min
  iat: now
         │
         │ Bearer token in HTTP request
         ▼
RC's /ci/plugins/<target>/<name> endpoint:
  1. Fetch GitHub's JWKS (public keys) — cached
  2. Verify JWT signature
  3. Check iss == "https://token.actions.githubusercontent.com"
  4. Check sub matches expected pattern
  5. Check aud == "rc.lilylabs.io"
  6. Check exp > now
  7. If all pass → serve the plugin binary
```

GitHub's JWKS endpoint:
`https://token.actions.githubusercontent.com/.well-known/jwks`

## What gets verified

Required claim values for our CI:

| Claim | Required value | Reason |
|---|---|---|
| `iss` | `https://token.actions.githubusercontent.com` | only GitHub can sign these |
| `aud` | `rc.lilylabs.io` | we requested this audience |
| `sub` | `repo:llylabs/compiler-tests:ref:refs/heads/main` | only main branch of our repo |
| `exp` | future | not expired (max 5 min lifetime) |

For PR runs, the `sub` would be
`repo:llylabs/compiler-tests:pull_request` — RC can choose
to allow PR runs too if they're useful (and PR runs from
forks don't get write access to secrets anyway, so it's
safe).

## Why forks can't bypass this

Suppose someone forks the repo and tries to abuse the CI:

```
fork repo: attacker/compiler-tests
attacker triggers their CI
GitHub mints JWT for attacker:
  sub: repo:attacker/compiler-tests:ref:refs/heads/main
                                    ↑
attacker sends JWT to RC
RC checks sub — does NOT match repo:llylabs/compiler-tests
RC rejects
```

The attacker cannot forge a JWT with our `sub` because they
don't have GitHub's private signing key (only GitHub does).
The attacker cannot get GitHub to put our `sub` into their
JWT (GitHub bases `sub` on the actual repo the workflow is
running in).

## What RC needs to implement

For this to work in production, RC needs a new endpoint:

```
GET /ci/plugins/<target>/<name>
  Authorization: Bearer <github-oidc-jwt>
  →
  200 OK + binary on success
  401 Unauthorized + reason on failure
```

The verification logic is ~30 lines of code. Standard JWT
library + cached JWKS lookup. The full spec:

```
function verify_ci_request(req) {
  jwt = extract_bearer(req.Authorization)

  jwks = cached_get("https://token.actions.githubusercontent.com/.well-known/jwks", ttl=1h)
  claims = jwt_verify(jwt, jwks)  // throws if signature bad

  assert claims.iss == "https://token.actions.githubusercontent.com"
  assert claims.aud == "rc.lilylabs.io"
  assert claims.sub starts_with "repo:llylabs/compiler-tests:"
  assert claims.exp > now()

  return ok
}
```

Until RC ships this endpoint, the workflow runs will fail
at the plugin-install step. That failure is honest and
visible — we don't pretend the tests passed when they
didn't.

## Local development

Want to test the workflow logic locally without RC's OIDC
endpoint?

```bash
# Skip OIDC, use ACTIONS_ID_TOKEN_REQUEST_TOKEN=""
PLUGINS="c cpp" \
LLY_RC_URL="https://rc.lilylabs.io" \
scripts/install-from-rc.sh
```

The script will detect no OIDC token is available and fall
back to anonymous (which today fails — but the error
message tells you why).

## Why this is the production-grade pattern

The same OIDC federation model is used by:

- **AWS** → IAM Roles for GitHub Actions
- **GCP** → Workload Identity Federation
- **HashiCorp Vault** → JWT auth method
- **Cloudflare** → Service tokens via OIDC

It's not a workaround. It's the modern standard for
secret-less CI auth.
