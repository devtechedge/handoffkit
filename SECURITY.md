# Security

HandoffKit is pre-launch and in active development. This file describes the current security
posture, what is implemented, what remains, and how to report a vulnerability.

## Threat model

- Accounts use email and password with scrypt and a per-user random salt.
- Sessions are random 32-byte tokens, stored hashed, in HttpOnly cookies.
- Every pack query is scoped to the signed-in account.
- Share pages use an unguessable public id and send `noindex, nofollow` headers.
- The n8n parser is deterministic. It never reads credential values, masks secret-like
  strings, and never stores raw workflow exports.
- The demo does not persist submitted workflows.
- Billing is not live. Lemon Squeezy checkout is disabled until its environment variables
  are configured.

## Residual risks

- There is no email verification, password reset, or OAuth yet.
- Data categories and AI use in a pack are inferred from node types, names, and parameters,
  and need human confirmation.
- The shared Neon database uses a dedicated schema. A dedicated Neon project is planned
  before paid launch.

## Reporting

Report vulnerabilities privately as a draft Security Advisory on GitHub under Security >
Advisories. You will receive an acknowledgement within 72 hours.
