// "use client";

// import { useEffect, useRef, useState } from "react";
// import { onMessage, Unsubscribe } from "firebase/messaging";
// import { useRouter } from "next/navigation";
// import { toast } from "sonner";
// import { fetchToken, messaging } from "@/config/db/firebase";

// async function getNotificationPermissionAndToken() {
//   // Step 1: Check if Notifications are supported in the browser.
//   if (!("Notification" in window)) {
//     console.info("This browser does not support desktop notification");
//     return null;
//   }

//   // Step 2: Check if permission is already granted.
//   if (Notification.permission === "granted") {
//     return await fetchToken();
//   }

//   // Step 3: If permission is not denied, request permission from the user.
//   if (Notification.permission !== "denied") {
//     const permission = await Notification.requestPermission();
//     if (permission === "granted") {
//       return await fetchToken();
//     }
//   }

//   console.log("Notification permission not granted.");
//   return null;
// }

// const useFcmToken = () => {
//   const router = useRouter(); // Initialize the router for navigation.
//   const [notificationPermissionStatus, setNotificationPermissionStatus] =
//     useState<NotificationPermission | null>(null); // State to store the notification permission status.
//   const [token, setToken] = useState<string | null>(null); // State to store the FCM token.
//   const retryLoadToken = useRef(0); // Ref to keep track of retry attempts.
//   const isLoading = useRef(false); // Ref to keep track if a token fetch is currently in progress.

//   const loadToken = async () => {
//     // Step 4: Prevent multiple fetches if already fetched or in progress.
//     if (isLoading.current) return;

//     isLoading.current = true; // Mark loading as in progress.
//     const token = await getNotificationPermissionAndToken(); // Fetch the token.

//     // Step 5: Handle the case where permission is denied.
//     if (Notification.permission === "denied") {
//       setNotificationPermissionStatus("denied");
//       console.info(
//         "%cPush Notifications issue - permission denied",
//         "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
//       );
//       isLoading.current = false;
//       return;
//     }

//     // Step 6: Retry fetching the token if necessary. (up to 3 times)
//     // This step is typical initially as the service worker may not be ready/installed yet.
//     if (!token) {
//       if (retryLoadToken.current >= 3) {
//         alert("Unable to load token, refresh the browser");
//         console.info(
//           "%cPush Notifications issue - unable to load token after 3 retries",
//           "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
//         );
//         isLoading.current = false;
//         return;
//       }

//       retryLoadToken.current += 1;
//       console.error("An error occurred while retrieving token. Retrying...");
//       isLoading.current = false;
//       await loadToken();
//       return;
//     }

//     // Step 7: Set the fetched token and mark as fetched.
//     setNotificationPermissionStatus(Notification.permission);
//     setToken(token);
//     isLoading.current = false;
//   };

//   useEffect(() => {
//     // Step 8: Initialize token loading when the component mounts.
//     if ("Notification" in window) {
//       loadToken();
//     }
//   }, []);

//   useEffect(() => {
//     const setupListener = async () => {
//       if (!token) return; // Exit if no token is available.

//       console.log(`onMessage registered with token ${token}`);
//       const m = await messaging();
//       if (!m) return;

//       // Step 9: Register a listener for incoming FCM messages.
//       const unsubscribe = onMessage(m, (payload) => {
//         if (Notification.permission !== "granted") return;

//         console.log("Foreground push notification received:", payload);
//         const link = payload.fcmOptions?.link || payload.data?.link;

//         if (link) {
//           toast.info(
//             `${payload.notification?.title}: ${payload.notification?.body}`,
//             {
//               action: {
//                 label: "Visit",
//                 onClick: () => {
//                   const link = payload.fcmOptions?.link || payload.data?.link;
//                   if (link) {
//                     router.push(link);
//                   }
//                 },
//               },
//             }
//           );
//         } else {
//           toast.info(
//             `${payload.notification?.title}: ${payload.notification?.body}`
//           );
//         }

//         // --------------------------------------------
//         // Disable this if you only want toast notifications.
//         const n = new Notification(
//           payload.notification?.title || "New message",
//           {
//             body: payload.notification?.body || "This is a new message",
//             data: link ? { url: link } : undefined,
//           }
//         );

//         // Step 10: Handle notification click event to navigate to a link if present.
//         n.onclick = (event) => {
//           event.preventDefault();
//           const link = (event.target as any)?.data?.url;
//           if (link) {
//             router.push(link);
//           } else {
//             console.log("No link found in the notification payload");
//           }
//         };
//         // --------------------------------------------
//       });

//       return unsubscribe;
//     };

//     let unsubscribe: Unsubscribe | null = null;

//     setupListener().then((unsub) => {
//       if (unsub) {
//         unsubscribe = unsub;
//       }
//     });

//     // Step 11: Cleanup the listener when the component unmounts.
//     return () => unsubscribe?.();
//   }, [token, router, toast]);

//   return { token, notificationPermissionStatus }; // Return the token and permission status.
// };

// export default useFcmToken;
// "use client";

// import { createContext, useContext, useEffect, useState } from "react";
// import { onMessage } from "firebase/messaging";
// import { toast } from "sonner";
// import { useRouter } from "next/navigation";
// import { fetchToken, messaging } from "@/config/db/firebase";

// const NotificationContext = createContext({});

// export const useNotification = () => useContext(NotificationContext);

// const GlobalNotificationProvider = ({
//   children,
// }: {
//   children: React.ReactNode;
// }) => {
//   const [fcmToken, setFcmToken] = useState<string | null>(null);
//   const router = useRouter();

//   useEffect(() => {
//     const initializeMessaging = async () => {
//       const m = await messaging();
//       if (!m) return;
//       // Fetch the FCM token (if needed).
//       const token = await fetchToken();
//       setFcmToken(token);

//       // Register the global listener for notifications.
//       onMessage(m, (payload) => {
//         console.log("Global notification received:", payload);

//         const link = payload.fcmOptions?.link || payload.data?.link;
//         const notificationTitle =
//           payload.notification?.title || "New Notification";
//         const notificationBody =
//           payload.notification?.body || "You have a new message.";

//         // Display toast notification
//         toast.info(`${notificationTitle}: ${notificationBody}`, {
//           action: link
//             ? {
//                 label: "View",
//                 onClick: () => router.push(link),
//               }
//             : undefined,
//         });

//         // Display system notification
//         if (Notification.permission === "granted") {
//           const n = new Notification(notificationTitle, {
//             body: notificationBody,
//             data: { url: link },
//           });

//           n.onclick = (event) => {
//             event.preventDefault();
//             const link = (event.target as any)?.data?.url;
//             if (link) {
//               router.push(link);
//             }
//           };
//         }
//       });
//     };

//     initializeMessaging();
//   }, [router]);

//   return (
//     <NotificationContext.Provider value={{ fcmToken }}>
//       {children}
//     </NotificationContext.Provider>
//   );
// };

// export default GlobalNotificationProvider;
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { onMessage, Unsubscribe } from "firebase/messaging";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchToken, messaging } from "@/config/db/firebase";

interface NotificationContextType {
  token: string | null;
  notificationPermissionStatus: NotificationPermission | null;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a GlobalNotificationProvider"
    );
  }
  return context;
};

const getNotificationPermissionAndToken = async (): Promise<string | null> => {
  if (!("Notification" in window)) {
    console.info("This browser does not support desktop notification");
    return null;
  }

  if (Notification.permission === "granted") {
    return await fetchToken();
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      return await fetchToken();
    }
  }

  console.info("Notification permission not granted.");
  return null;
};

const GlobalNotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const [notificationPermissionStatus, setNotificationPermissionStatus] =
    useState<NotificationPermission | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const retryLoadToken = useRef(0);
  const isLoading = useRef(false);

  const loadToken = async () => {
    if (isLoading.current) return;

    isLoading.current = true;
    const fetchedToken = await getNotificationPermissionAndToken();

    if (Notification.permission === "denied") {
      setNotificationPermissionStatus("denied");
      console.info(
        "%cPush Notifications issue - permission denied",
        "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
      );
      isLoading.current = false;
      return;
    }

    if (!fetchedToken) {
      if (retryLoadToken.current >= 3) {
        alert("Unable to load token, refresh the browser");
        console.info(
          "%cPush Notifications issue - unable to load token after 3 retries",
          "color: green; background: #c7c7c7; padding: 8px; font-size: 20px"
        );
        isLoading.current = false;
        return;
      }

      retryLoadToken.current += 1;
      console.error("An error occurred while retrieving token. Retrying...");
      isLoading.current = false;
      await loadToken();
      return;
    }

    setNotificationPermissionStatus(Notification.permission);
    setToken(fetchedToken);
    isLoading.current = false;
  };

  const setupListener = async () => {
    const m = await messaging();
    if (!m) return;

    const unsubscribe = onMessage(m, (payload) => {
      if (Notification.permission !== "granted") return;

      console.log("Foreground push notification received:", payload);
      const link = payload.fcmOptions?.link || payload.data?.link;

      toast.info(
        `${payload.notification?.title}: ${payload.notification?.body}`,
        {
          action: link
            ? {
                label: "Visit",
                onClick: () => router.push(link),
              }
            : undefined,
        }
      );

      if (Notification.permission === "granted") {
        const n = new Notification(
          payload.notification?.title || "New Notification",
          {
            body: payload.notification?.body || "You have a new message",
            data: { url: link },
          }
        );

        n.onclick = (event) => {
          event.preventDefault();
          const link = (event.target as any)?.data?.url;
          if (link) {
            router.push(link);
          }
        };
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    if ("Notification" in window) {
      loadToken();
    }
  }, []);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    setupListener().then((unsub) => {
      if (unsub) {
        unsubscribe = unsub;
      }
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [token]);

  return (
    <NotificationContext.Provider
      value={{ token, notificationPermissionStatus }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default GlobalNotificationProvider;
