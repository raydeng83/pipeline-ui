/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


   

outcome = "true";




# SLO Demo Guide — sb3 (EC2)

**EC2:** `54.147.154.194`
**Clear all browser cookies (or use incognito) before each test.**

## Test User

| Field | Value |
|-------|-------|
| Username | `aaron_test3` |
| Password | `1987@aA2013` |

---

## Test 1: OIDC RP-Initiated Logout

1. http://54.147.154.194:3333 → Login → authenticate aaron_test3
2. http://54.147.154.194:8000 → confirm SSO logged in
3. Open Network tab on OIDC app, clear it
4. http://54.147.154.194:3333 → Logout
5. Check http://54.147.154.194:3333
6. Check http://54.147.154.194:8000

**Key request (Network tab):**
- `GET /am/oauth2/alpha/connect/endSession?post_logout_redirect_uri=...&client_id=aaron_test_oidc_app&id_token_hint=<JWT>` — RP asks IdP to destroy session
- Redirect back to `http://54.147.154.194:3333/logged-out` — IdP confirms logout

---

## Test 2: SAML SP-Initiated Logout

1. http://54.147.154.194:8000 → Login → authenticate aaron_test3
2. http://54.147.154.194:3333 → confirm SSO logged in
3. Open Network tab on SAML app, clear it. Also open http://54.147.154.194:3333/logs in another tab
4. http://54.147.154.194:8000 → Logout
5. Check http://54.147.154.194:8000
6. Check http://54.147.154.194:3333

**Key requests (Network tab):**
- `GET /am/SPSloInit?binding=...` — SP initiates logout via ForgeRock's SPSloInit endpoint
- ForgeRock destroys AM session and shows "SP initiated single logout succeeded"

**Backchannel logout (server-to-server, NOT visible in browser Network tab):**
- ForgeRock POSTs `logout_token` directly to the OIDC app- View in **OIDC logs page** http://54.147.154.194:3333/logs — `POST /backchannel-logout` with body `logout_token=<JWT>`

---

## Test 3: SAML IdP-Initiated Logout

1. http://54.147.154.194:3333 → Login → authenticate aaron_test3
2. http://54.147.154.194:8000 → confirm SSO logged in
3. Open Network tab, and open http://54.147.154.194:3333/logs in another tab
4. Open:
```
https://openam-commkentsb3-use1-sandbox.id.forgerock.io/am/IDPSloInit?metaAlias=/alpha/aaron_test_saml_sp&binding=urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect
```
5. Check http://54.147.154.194:8000
6. Check http://54.147.154.194:3333

**Key requests (Network tab):**
- `GET /?sls&SAMLRequest=<base64>` — IdP sends LogoutRequest to SP via browser redirect
- SP responds with LogoutResponse back to IdP

**Backchannel logout (server-to-server, NOT visible in browser Network tab):**
- ForgeRock POSTs `logout_token` directly to the OIDC app- View in **OIDC logs page** http://54.147.154.194:3333/logs — `POST /backchannel-logout` with body `logout_token=<JWT>`


