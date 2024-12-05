"use server";
export async function sendNotification(
  token: string | null,
  title: string,
  message: string,
  link: string
) {
  const response = await fetch("api/send-notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, title, message, link }),
  });

  if (!response.ok) {
    throw new Error("Failed to send notification");
  }

  return await response.json();
}
