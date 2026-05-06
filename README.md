# Dynamic Data Collection Tool Backend

## Environment

Create a `.env` file from `.env.example`.

Required values:

- `MONGO_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: a strong random secret
- `CLIENT_URLS`: comma-separated frontend URLs allowed by CORS

Bootstrap super admin values:

- `SUPER_ADMIN_NAME`: first super admin display name
- `SUPER_ADMIN_EMAIL`: first super admin login email
- `SUPER_ADMIN_PASSWORD`: first super admin login password

Example production values:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dynamic-data-collection?retryWrites=true&w=majority
JWT_SECRET=change-this-to-a-long-random-secret
CLIENT_URLS=https://your-frontend-domain.vercel.app
SUPER_ADMIN_NAME=Super Admin
SUPER_ADMIN_EMAIL=admin@gov.local
SUPER_ADMIN_PASSWORD=Admin@123
MAIL_FROM=yourgmail@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your_16_character_gmail_app_password
SMTP_CONNECTION_TIMEOUT=10000
SMTP_GREETING_TIMEOUT=10000
SMTP_SOCKET_TIMEOUT=20000
```

## Run

```bash
npm install
npm run dev
```

## Seed First Super Admin

Run this once against the database you want to initialize:

```bash
npm run seed:superadmin
```

The script creates the first `SUPER_ADMIN` from the `SUPER_ADMIN_*` environment variables and skips creation if that email already exists.

## Repair Role Indexes

If your database still has an old `roleName_1` unique index from an earlier schema, role creation can fail after the first insert with a duplicate-key error on `roleName: null`.

Run this repair once against the affected database:

```bash
npm run fix:roles
```

The script will:

- drop the legacy `roleName_1` index if present
- migrate any old `roleName` values into `name`
- normalize role names to uppercase
- recreate the correct unique index on `name`

## Deploy Notes

- Use MongoDB Atlas for the database.
- Set all backend environment variables in your hosting platform.
- Make sure the frontend uses `VITE_API_BASE_URL=https://your-backend-domain/api`.
- Make sure `CLIENT_URLS` contains the deployed frontend URL.
- For production, set `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` before running `npm run seed:superadmin`.
- If forgot-password requests hang or time out, verify the SMTP values above and check that the hosting provider can reach the mail server.
