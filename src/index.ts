import express from "express";
import fs from "fs";
import path from "path";
import qrCode from "qrcode";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/StringSession.js";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const apiId = parseInt(process.env.TELEGRAM_API_ID!, 10);
const apiHash = process.env.TELEGRAM_API_HASH!;

// In-memory database for sessions
const sessions: { [key: string]: any } = {};

const qrCodesDir = path.join(path.resolve("."), "qrcodes");

if (!fs.existsSync(qrCodesDir)) {
	await fs.promises.mkdir(qrCodesDir, { recursive: true });
}

/**
 * POST /authorize
 * Request Body:
 * {
 *   "password": "password"
 * }
 *
 * Expected response:
 * {
 *   "message": "Scan QR to login",
 *   "qrCodeFile": "unique_filename.png",
 *   "sessionString": "...",
 *   "userId": 1111111
 * }
 */
app.post("/authorize", async (req, res) => {
	try {
		// Create a new Telegram client with an empty session
		const client = new TelegramClient(new StringSession(""), apiId, apiHash, { connectionRetries: 5 });
		await client.connect().then((v) => console.log(`Client ${v ? "connected" : "failed to connect"}`));

		// Generate a unique name for qr image
		const uniqueFilename = `${uuidv4()}.png`;
		const filePath = path.join(qrCodesDir, uniqueFilename);

		// Send a qr code to the user and ask him to auth
		await client.signInUserWithQrCode(
			{ apiId, apiHash },
			{
				onError: async (err) => {
					console.error("Error during QR login:", err);
					// stop the authorization
					return true;
				},
				qrCode: async (code) => {
					const tokenUrl = `tg://login?token=${code.token.toString("base64url")}`;

					await qrCode.toFile(filePath, tokenUrl);
					console.log("QR code generated:", filePath);
				},
				password: async (hint) => {
					if (req.body.password) return req.body.password;

					throw new Error(`2FA password required but not provided\t${hint ? "Hint: " + hint : ""}`);
				},
			}
		);

		// Save the session for later use
		const sessionString = client.session.save();
		const userId = (await client.getMe()).id;

		sessions[userId.toString()] = sessionString;

		// Respond with authorization details
		res.json({
			message: "Authorized via QR",
			sessionString,
			userId,
		});

		console.log("A new user successfully authorized and saved");
	} catch (error: any) {
		console.error("Authorization error", error);
		res.status(401).json({ error: error.message });
	}
});

/**
 * POST /send-message
 * Request Body:
 * {
 *   "userId": 123456789,
 *   "recipient": "@user_tag or @number user/chat id",
 *   "message": "placeholder message",
 *   "attachment": "path to local file"
 * }
 */
app.post("/send-message", async (req, res) => {
	try {
		const { userId, recipient, message, attachment } = req.body;
		if (!sessions[userId]) {
			res.status(401).json({ error: "User not authorized or session expired" });
			return;
		}

		const client = new TelegramClient(new StringSession(sessions[userId]), apiId, apiHash, { connectionRetries: 5 });
		await client.connect();

		await client.sendMessage(recipient, { message, file: attachment ? attachment : [] });

		res.json({ message: "Message sent successfully" });

		console.log("A new message was successfully sent");
	} catch (error: any) {
		console.error("Send message error:", error);
		res.status(500).json({ error: error.message });
	}
});

app.listen(3000, () => console.log(`Server running`));
