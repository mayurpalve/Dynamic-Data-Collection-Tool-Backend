# Dynamic Data Collection Tool Backend

## Environment

Create a `.env` file from `.env.example`.

Required values:

- `MONGO_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: a strong random secret
- `CLIENT_URLS`: comma-separated frontend URLs allowed by CORS

Example production values:

```env
PORT=5000
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dynamic-data-collection?retryWrites=true&w=majority
JWT_SECRET=change-this-to-a-long-random-secret
CLIENT_URLS=https://your-frontend-domain.vercel.app
```

## Run

```bash
npm install
npm run dev
```

## Deploy Notes

- Use MongoDB Atlas for the database.
- Set all backend environment variables in your hosting platform.
- Make sure the frontend uses `VITE_API_BASE_URL=https://your-backend-domain/api`.
- Make sure `CLIENT_URLS` contains the deployed frontend URL.
