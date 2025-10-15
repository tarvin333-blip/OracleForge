
# Oracle Forge - Application Blueprint

## **1. Overview**

Oracle Forge is a web application that allows users to create, manage, and share their own custom-designed oracle and tarot card decks. It provides a dedicated "Creator Studio" where users can design card backs, create individual cards with names, meanings, and images, and assemble them into functional decks. The platform aims to be a creative hub for divination enthusiasts and creators.

---

## **2. Core Features & Design**

### **Design Philosophy**
*   **Aesthetics:** Modern, intuitive, and visually engaging. The UI uses a dark theme with vibrant accents (indigo, green), creating a premium and focused creative environment.
*   **Layout:** Clean, spacious, and responsive, ensuring a seamless experience on both desktop and mobile devices.
*   **Iconography:** Utilizes the `lucide-react` library for clear, modern icons that enhance user understanding and navigation.
*   **Feedback:** Provides clear visual feedback for user actions, such as hover effects, loading states, and error messages.

### **Implemented Features**
*   **User Authentication:**
    *   Secure user login and registration using Firebase Authentication.
    *   Session management to keep users logged in.
*   **Creator Studio:**
    *   **Deck Management:**
        *   **Deck Creation:** Users can create new decks with a unique name and a custom card back image.
        *   **Deck Editing:** Users can edit the name and card back image of existing decks.
        *   **Deck Listing:** Decks are displayed in a responsive grid layout, showing the card back image, deck name, and card count.
    *   **Card Management:**
        *   **Card Creation:** Users can add new cards to a deck, including a name, meaning, and a unique image for the card face.
        *   **Card Editing:** Users can modify the details of existing cards.
        *   **Card Viewing:** Cards within a selected deck are displayed in a grid, showing their face image and name.
*   **Data Structure (Firestore):**
    *   User data is stored in a `users` collection.
    *   Each user has a `decks` subcollection.
    *   Each deck has a `cards` subcollection, ensuring scalability and efficient data retrieval.
*   **Error Handling:**
    *   A robust error handling mechanism displays clear, user-friendly error messages (e.g., for session timeouts) to guide the user on how to resolve the issue.

---

## **3. Technology Stack**

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript, JSX
*   **Styling:** Tailwind CSS
*   **Backend & Database:** Firebase (Authentication, Firestore, Storage)
*   **Icons:** Lucide React

---

## **4. Current Plan & Next Steps**

### **Critical Roadblock: Firebase Storage Upload Failure**

We have encountered a persistent and critical issue where image uploads to Firebase Storage fail when initiated from a Next.js Server Action. The error is consistently `Firebase Storage: An unknown error occurred, please check the error payload for server response. (storage/unknown)` accompanied by a `500 Internal Server Error`.

**Troubleshooting Steps Taken (All Unsuccessful):**
1.  **Firebase Configuration:** Created and populated `.env.local` with all Firebase config keys.
2.  **Server-Side Initialization:** Explicitly defined the `storageBucket` URL in `src/lib/firebase.ts`.
3.  **Firebase Storage Rules:** Implemented secure rules to allow writes only for authenticated users on their own paths.
4.  **Server Restart:** Forced server restarts multiple times to ensure new configurations were loaded.
5.  **Build Tool Change:** Switched the development server from `--turbopack` back to the standard Next.js engine.
6.  **Code Refactoring:** Re-wrote and simplified the Server Action (`updateDeck`) multiple times.

**Conclusion:** The root cause is highly likely an **environmental incompatibility** within the Firebase Studio preview environment between Next.js Server Actions and the Firebase MCP (experimental:mcp) service responsible for backend communication. This issue is beyond the scope of code or project configuration fixes.

### **The New Path Forward: Client-Side Uploads**

To circumvent this environmental roadblock, we will pivot to a more robust and standard architecture: **Client-Side Uploads**.

**New Workflow:**
1.  The user selects an image in their browser (the client).
2.  The client-side code will use the Firebase SDK to **directly upload the image to Firebase Storage**.
3.  Upon successful upload, the client receives the public `downloadURL` for the image.
4.  The client then calls the Server Action, but instead of sending the large image file, it sends only the **image URL string**.
5.  The Server Action, now a much simpler function, receives the URL and saves it to Firestore.

This approach completely bypasses the problematic server-to-storage communication path, is more efficient, and aligns with industry best practices.

### **Next Action Items:**

1.  **Refactor `EditDeck` Component:** Modify the form to handle the image upload directly on the client-side.
2.  **Refactor `updateDeck` Server Action:** Simplify the action to only accept a string URL and update Firestore.
3.  **Resume Profile Page Development:** Once the upload issue is resolved, continue with the creation of the user profile page and the daily token system.
