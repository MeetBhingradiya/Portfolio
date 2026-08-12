import mongoose from "mongoose";
import dotenv from "dotenv";
import { SSOApp, SSOAppAccess, SSOAuthCode } from "../src/Models/SSO";

// This script migrates the old ImmichWhitelist to the new SSOAppAccess models.
// It uses your existing environment variables to create the first SSOApp ("Immich").

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined.");
    process.exit(1);
}

const IMMICH_CLIENT_ID = process.env.IMMICH_SSO_CLIENT_ID || "immich";
const IMMICH_CLIENT_SECRET = process.env.IMMICH_SSO_CLIENT_SECRET || "";
const IMMICH_GATE_KEY = process.env.IMMICH_SSO_GATE_KEY || "";
const IMMICH_REDIRECT_URIS = [
    // Add default Immich redirect URIs. Usually it's something like:
    "https://immich.meetbhingradiya.in/auth/login",
    "app.immich:/",
];

async function migrate() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI as string);
    console.log("Connected.");

    try {
        console.log("Creating Immich SSO App...");
        let app = await SSOApp.findOne({ clientId: IMMICH_CLIENT_ID });
        if (!app) {
            app = await SSOApp.create({
                name: "Immich",
                clientId: IMMICH_CLIENT_ID,
                clientSecret: IMMICH_CLIENT_SECRET,
                redirectUris: IMMICH_REDIRECT_URIS,
                gateKey: IMMICH_GATE_KEY,
                enabled: true,
                addedBy: "system_migration"
            });
            console.log("Created Immich SSO App:", app._id);
        } else {
            console.log("Immich SSO App already exists:", app._id);
        }

        console.log("Migrating Whitelist Entries...");
        const db = mongoose.connection.db;
        if (!db) throw new Error("DB connection failed");

        const oldWhitelistCol = db.collection("immichwhitelists");
        const oldEntries = await oldWhitelistCol.find({}).toArray();

        console.log(`Found ${oldEntries.length} old whitelist entries.`);
        
        let migratedCount = 0;
        for (const entry of oldEntries) {
            const existing = await SSOAppAccess.findOne({ appId: app._id, email: entry.email });
            if (!existing) {
                await SSOAppAccess.create({
                    appId: app._id,
                    email: entry.email,
                    label: entry.label,
                    note: entry.note,
                    enabled: entry.enabled,
                    addedBy: entry.addedBy,
                    addedAt: entry.addedAt,
                    lastAccess: entry.lastAccess,
                    accessCount: entry.accessCount,
                    userId: entry.userId,
                    linkedAccount: entry.linkedAccount,
                    subOverride: entry.subOverride,
                    lastIssuedSub: entry.lastIssuedSub
                });
                migratedCount++;
            }
        }
        
        console.log(`Successfully migrated ${migratedCount} whitelist entries.`);

        console.log("Migration complete!");
        
    } catch (e) {
        console.error("Migration failed:", e);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected.");
    }
}

migrate();
