# LIAN API Bridge — Vercel

Bridge sederhana untuk meneruskan request dari API milikmu ke API provider yang kamu beli.

## 1. Deploy

Upload project ini ke GitHub lalu import repository tersebut ke Vercel.

Atau dari terminal:

```bash
npm i -g vercel
vercel
```

## 2. Tambahkan Environment Variables di Vercel

Set:

```text
API_BASE_URL=https://api-provider.example.com
PROVIDER_API_KEY=KEY_ASLI_DARI_PROVIDER
CLIENT_API_KEYS=["LIAN-demo-123","LIAN-demo-456"]
```

Contoh jika provider mempunyai endpoint:

```text
https://api-provider.example.com/search?q=naruto
```

maka:

```text
API_BASE_URL=https://api-provider.example.com
```

dan request bridge:

```text
https://DOMAIN-KAMU.vercel.app/api/search?q=naruto&apikey=LIAN-demo-123
```

Bridge akan memanggil provider tanpa meneruskan `apikey` milik user.

## 3. API key user

User cukup memakai:

```text
apikey=LIAN-demo-123
```

atau header:

```text
x-api-key: LIAN-demo-123
```

API key provider tetap berada di server Vercel.

## Penting

Versi starter ini menyimpan daftar client key di Environment Variable.
Itu cocok untuk testing / jumlah key kecil.

Untuk sistem produksi dengan:
- generate key dari dashboard
- revoke key
- expiry
- request counter
- rate limit yang persisten
- banyak pengguna

gunakan database/KV seperti Vercel KV/Redis/Postgres atau database lain.

## Jika provider memakai header selain Bearer

Default kode menggunakan:

```text
Authorization: Bearer PROVIDER_API_KEY
```

Jika provider memakai:

```text
x-api-key: KEY
```

ubah bagian:

```js
headers.set("Authorization", `Bearer ${providerKey}`);
```

menjadi:

```js
headers.set("x-api-key", providerKey);
```

Periksa dokumentasi provider karena aturan penggunaan ulang/proxy API juga bergantung pada lisensi dan Terms of Service provider tersebut.
