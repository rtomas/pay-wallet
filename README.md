# Pay Wallet

Non-custodial stablecoin wallet (USDC/USDT) with passkey auth, supporting Solana + EVM (Ethereum Mainnet + Base).

## Setup

### 1. Database (Neon Postgres)

1. Create a free database at [neon.tech](https://neon.tech)
2. Copy the connection string and set it in `.env.local`:

```
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
```

3. Push the schema to your database:

```bash
npm run db:push
```

### 2. WebAuthn

Set the relying party config in `.env.local`. For local development:

```
WEBAUTHN_RP_NAME=Pay Wallet
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000
```

For production, update to your real domain:

```
WEBAUTHN_RP_NAME=Pay Wallet
WEBAUTHN_RP_ID=yourdomain.com
WEBAUTHN_ORIGIN=https://yourdomain.com
```

> `WEBAUTHN_RP_ID` must match the domain the browser sees. Passkeys registered on one RP ID won't work on another.

### 3. JWT Secret

Generate a random secret for signing session tokens:

```bash
openssl rand -base64 48
```

Set it in `.env.local`:

```
JWT_SECRET=your-generated-secret-here
```

### 4. RPC Endpoints (optional)

For balance fetching and transaction broadcasting. Free tier from [Alchemy](https://www.alchemy.com/) or [Infura](https://www.infura.io/) works:

```
ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
BASE_RPC_URL=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

### 5. WalletConnect (optional)

Only needed for the Pay flow. Get a project ID at [cloud.walletconnect.com](https://cloud.walletconnect.com/):

```
WALLETCONNECT_PROJECT_ID=your_project_id
```

## Run

```bash
npm install
npm run db:push   # first time only
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Full `.env.local` template

```env
# Database (required)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# WebAuthn (required)
WEBAUTHN_RP_NAME=Pay Wallet
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# JWT (required)
JWT_SECRET=change-me

# RPC Endpoints (optional — needed for balances/transfers)
ETH_RPC_URL=
BASE_RPC_URL=
SOLANA_RPC_URL=

# WalletConnect (optional — needed for Pay flow)
WALLETCONNECT_PROJECT_ID=
```
