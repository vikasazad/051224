import admin from "firebase-admin";
import { Message } from "firebase-admin/messaging";
import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.FIREBASE_ADMIN_CREDENTIALS) {
  throw new Error("FIREBASE_ADMIN_CREDENTIALS is not defined");
}

const serviceAccount = process.env.FIREBASE_ADMIN_CREDENTIALS; // Replace escaped newlines

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export async function POST(request: NextRequest) {
  const { token, title, message, link } = await request.json();

  const payload: Message = {
    token,
    notification: {
      title: title,
      body: message,
    },
    webpush: link && {
      fcmOptions: {
        link,
      },
    },
  };

  try {
    await admin.messaging().send(payload);

    return NextResponse.json({ success: true, message: "Notification sent!" });
  } catch (error) {
    return NextResponse.json({ success: false, error });
  }
}
