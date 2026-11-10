const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("@whiskeysockets/baileys");
const P = require("pino");

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");

    const sock = makeWASocket({
        auth: state,
        logger: P({ level: "silent" }),
        browser: ["My Baileys Bot", "Chrome", "1.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log("QR code generated. Check your server logs.");
        }

        if (connection === "open") {
            console.log("Bot connected successfully!");
        }

        if (connection === "close") {
            const statusCode = lastDisconnect?.error?.output?.statusCode;

            if (statusCode !== DisconnectReason.loggedOut) {
                startBot();
            } else {
                console.log("Session logged out. Reconnection required.");
            }
        }
    });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];

        if (!msg.message || msg.key.fromMe) return;

        const text = msg.message.conversation ||
            msg.message.extendedTextMessage?.text;

        if (!text) return;

        if (text.toLowerCase() === ".ping") {
            await sock.sendMessage(msg.key.remoteJid, {
                text: "Pong! 🏓 Bot is online."
            });
        }
    });
}

startBot();
