'use server';

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';

// Function to update a user's profile information (username and avatar)
export async function updateUserProfile(uid, username, newAvatarImage) {
    if (!uid) {
        throw new Error('You must be logged in to update your profile.');
    }

    try {
        const userRef = doc(db, 'users', uid);
        const updateData: { [key: string]: any } = { username };

        // If a new avatar is provided, upload it to Storage
        if (newAvatarImage) {
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();

            // Define path for the new avatar
            const avatarPath = `users/${uid}/avatar/avatar.jpg`;
            const storageRef = ref(storage, avatarPath);
            
            // Upload the new image, overwriting any existing one at the same path
            await uploadString(storageRef, newAvatarImage, 'data_url');
            const imageUrl = await getDownloadURL(storageRef);
            updateData.avatarUrl = imageUrl;
        }

        // Update the user document in Firestore
        await updateDoc(userRef, updateData);

        return { success: true, message: 'Profile updated successfully.' };

    } catch (error) {
        console.error('[updateUserProfile] Detailed Firebase Error:', error);
        throw new Error(`Profile update failed. Original error: ${error.message}`);
    }
}

// Function to check and grant a daily login token
export async function grantDailyToken(uid) {
    if (!uid) {
        throw new Error('User not logged in.');
    }

    try {
        const userRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error("User document doesn't exist.");
        }

        const userData = userDoc.data();
        const lastClaimTimestamp = userData.lastLoginClaim?.toDate(); // Convert Firebase Timestamp to JS Date
        const now = new Date();

        // Check if the last claim was today. If so, do nothing.
        if (lastClaimTimestamp && lastClaimTimestamp.toDateString() === now.toDateString()) {
            return { success: true, message: 'Daily token already claimed today.' };
        }

        // If not claimed today, grant a token and update the timestamp
        const newBalance = (userData.tokenBalance || 0) + 1;
        await updateDoc(userRef, {
            tokenBalance: newBalance,
            lastLoginClaim: now, // This will be stored as a Firebase Timestamp
        });

        return { success: true, message: 'Daily token granted!', newBalance };

    } catch (error) {
        console.error('[grantDailyToken] Detailed Firebase Error:', error);
        throw new Error(`Failed to grant daily token. Original error: ${error.message}`);
    }
}
