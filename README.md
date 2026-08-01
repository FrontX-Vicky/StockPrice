# Live Stock Market Data Web App (Angel One Integration)

This project displays live Indian Stock Market data (Nifty 50, F&O) by connecting to the **Angel One SmartAPI** via a Node.js backend.

## Project Structure
We have split the project into two distinct parts:
- `frontend/`: The Vite + React web application that displays the UI.
- `backend/`: The Node.js Express server that securely connects to Angel One and forwards the live WebSocket stream to the frontend.

## Step 1: Obtain Angel One Credentials

To use the live API, you will need 4 specific credentials. **Keep these private and never share them.**

1. **Client Code**: This is your Angel One User ID (e.g., `A123456`).
2. **PIN**: The 4-digit PIN you use to log into the Angel One app/website.
3. **API Key**:
   - Go to the [SmartAPI Portal](https://smartapi.angelbroking.com/).
   - Log in and click on **Create an App**.
   - Select **Trading API**, give it a name, and enter a redirect URL (e.g., `http://127.0.0.1`).
   - Copy the generated API Key.
4. **TOTP Secret**:
   - Angel One mandates Two-Factor Authentication (TOTP).
   - Go to [SmartAPI Enable TOTP](https://smartapi.angelbroking.com/enable-totp).
   - Enter your Client Code and PIN to log in.
   - You will see a QR Code. **Below the QR Code, there is a text string (the TOTP Secret).** 
   - *Copy this text string exactly as it is.* (Do not just scan the QR code; you need the text string itself for the backend to generate codes automatically).

## Step 2: Configure the Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open the `.env` file and fill in the 4 credentials you gathered above.
4. Install dependencies and start the backend:
   ```bash
   npm install
   npm run start
   ```

## Step 3: Run the Frontend

In a new terminal window:
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies (if you haven't already):
   ```bash
   npm install
   ```
3. Start the Vite React app:
   ```bash
   npm run dev
   ```

Open your browser to the local URL provided by Vite (usually `http://localhost:5173`). You should see live flashing prices streamed directly from your Angel One account!

## Docker & Local Infrastructure

This project is fully dockerized for instant local deployments and seamless production builds. We use a multi-container setup via Docker Compose:
- **Frontend Container**: Nginx server on port `3000`.
- **Backend Container**: Node.js server on port `8080`.

**To run via Docker:**
Ensure Docker Desktop is running, then execute the helper script from the root of the project:
```bash
./scripts/start-local.sh
```
To stop the application gracefully:
```bash
./scripts/stop-local.sh
```

## Advanced: VS Code DevContainers

To completely bypass installing Node or managing dependencies on your host machine, this repository includes a `.devcontainer` configuration. 
This is the professional standard for ensuring perfectly consistent environments across a team.

1. Install the **"Dev Containers"** extension in VS Code.
2. Open the `StockPrice` folder in VS Code.
3. When prompted in the bottom right corner, click **"Reopen in Container"** (or use the Command Palette: `Dev Containers: Reopen in Container`).
4. VS Code will automatically download a Node 20 Linux image, mount your code, and run `npm install` for both the frontend and backend.
5. You can now use the terminal *inside* VS Code exactly as if you were running natively! 
