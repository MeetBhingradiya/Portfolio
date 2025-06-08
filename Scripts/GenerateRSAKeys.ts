import crypto from "crypto";
import fs from "fs";
import path from "path";

function CreateRSAKeys() {
	return crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: {
			type: "spki",
			format: "pem",
		},
		privateKeyEncoding: {
			type: "pkcs8",
			format: "pem",
		},
	});
}

function SaveRSAKeysToFile(publicKey: string, privateKey: string) {
	const dir = path.join(__dirname, "../keys");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	fs.writeFileSync(path.join(dir, "public.pem"), publicKey);
	fs.writeFileSync(path.join(dir, "private.pem"), privateKey);
}

const { publicKey, privateKey } = CreateRSAKeys();
console.log("RSA keys generated successfully.");

SaveRSAKeysToFile(publicKey, privateKey);
