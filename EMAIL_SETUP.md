Gmail OTP Email Setup

1. Open your Google account security settings.
2. Enable 2-Step Verification.
3. Open `App passwords`.
4. Create a new app password for mail usage.
5. Copy the 16-character app password.

Update your backend `.env` with:

```env
NODE_ENV=production
APP_NAME=MSRTC Portal
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

Notes:

- `MAIL_FROM` should usually match `SMTP_USER`.
- If requests hang and later fail, verify the SMTP host, port, and network access from the server. The timeout values above control how quickly the app gives up on a bad mail connection.
- In development, the API still returns the OTP in the response.
- In production, the backend sends the OTP email and no longer exposes the OTP in the API response.
- If the email does not arrive, check spam first, then verify the app password and sender address.

Quick test flow:

1. Restart the backend after updating `.env`.
2. Open `Forgot Password` in the frontend.
3. Enter a real recipient email stored in the system.
4. Submit the OTP request.
5. Check the inbox of that user.
