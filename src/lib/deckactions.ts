'use server';

import { adminDb, adminStorage } from './firebase-admin';
import { Buffer } from 'buffer';

// Re-usable helper function to upload images using the Admin SDK
async function uploadImageAsAdmin(filePath, imageDataUrl) {
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        throw new Error('Invalid or missing image data URL.');
    }

    const imageMatch = imageDataUrl.match(/^data:(image\/[a-z]+);base64,(.+)$/);
    if (!imageMatch) {
        throw new Error('Invalid image data format. Must be a Base64 data URL.');
    }

    const contentType = imageMatch[1];
    const base64Data = imageMatch[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const bucket = adminStorage.bucket();
    const file = bucket.file(filePath);

    await file.save(buffer, { 
        metadata: { contentType } 
    });
    
    // Get a long-lived signed URL, valid for a very long time.
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // A date far in the future
    });
    
    return url;
}

// Helper to delete a file from a Google Cloud Storage URL
async function deleteFileFromUrl(fileUrl) {
    if (!fileUrl) return;
    try {
        const url = new URL(fileUrl);
        // Pathname is like /b/[BUCKET]/o/[FILE_PATH]
        // We need to extract the [FILE_PATH]
        const filePath = decodeURIComponent(url.pathname.split('/o/')[1]);

        if (filePath) {
            const bucket = adminStorage.bucket();
            const file = bucket.file(filePath);
            await file.delete();
            console.log(`Successfully deleted ${filePath} from storage.`);
        }
    } catch (error) {
        // Log the error but don't re-throw, as the main operation might still succeed
        console.error(`Failed to delete file from URL ${fileUrl}:`, error);
    }
}

export async function createDeck(uid, deckName, cardBackImage) {
    if (!uid) throw new Error('User UID is required.');
    if (!deckName) throw new Error('Deck name is required.');

    try {
        const collectionRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks'));
        const docRef = collectionRef.doc(); // Create a new document reference to get an ID

        const imagePath = `users/${uid}/decks/${docRef.id}/card-back`;
        const imageUrl = await uploadImageAsAdmin(imagePath, cardBackImage);

        await docRef.set({
            name: deckName,
            cardBack: imageUrl,
            cardBackingUrl: imageUrl, // for compatibility
            cardCount: 0,
            createdAt: new Date().toISOString(),
            userId: uid,
        });

        return { id: docRef.id };

    } catch (error) {
        console.error('[Admin createDeck] Error:', error);
        throw new Error(`Failed to create deck using admin privileges: ${error.message}`);
    }
}

export async function updateDeck(uid, deckId, deckName, newCardBackImage, oldData) {
    if (!uid || !deckId) throw new Error('User UID and Deck ID are required.');

    try {
        const docRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks')).doc(deckId);
        const updateData: { [key: string]: any } = { name: deckName };

        if (newCardBackImage) {
            // Upload the new image first
            const imagePath = `users/${uid}/decks/${deckId}/card-back-${Date.now()}`;
            const newImageUrl = await uploadImageAsAdmin(imagePath, newCardBackImage);
            updateData.cardBack = newImageUrl;
            updateData.cardBackingUrl = newImageUrl; // Ensure compatibility

            // After successful upload, delete the old image
            if (oldData?.cardBackingUrl) {
                // We don't need to wait for this to finish
                deleteFileFromUrl(oldData.cardBackingUrl);
            }
        }

        await docRef.update(updateData);

        return { success: true };

    } catch (error) {
        console.error('[Admin updateDeck] Error:', error);
        throw new Error(`Failed to update deck using admin privileges: ${error.message}`);
    }
}

export async function deleteDeck(uid, deckId) {
    if (!uid || !deckId) throw new Error('User UID and Deck ID are required.');

    const deckRef = adminDb.collection('users').doc(uid).collection('decks').doc(deckId);
    const cardsRef = deckRef.collection('cards');

    try {
        // 1. Delete all images within the cards subcollection
        const cardsSnapshot = await cardsRef.get();
        const cardImagePromises = [];
        cardsSnapshot.forEach(doc => {
            const cardData = doc.data();
            if (cardData.imageUrl) {
                cardImagePromises.push(deleteFileFromUrl(cardData.imageUrl));
            }
        });
        await Promise.all(cardImagePromises);

        // 2. Delete the cards subcollection recursively (all documents within)
        const batch = adminDb.batch();
        cardsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 3. Delete the main card back image for the deck
        const deckDoc = await deckRef.get();
        if (deckDoc.exists) {
            const deckData = deckDoc.data();
            if (deckData.cardBack) {
                await deleteFileFromUrl(deckData.cardBack);
            }
        }

        // 4. Delete the deck document itself
        await deckRef.delete();

        return { success: true, message: 'Deck and all associated data deleted.' };

    } catch (error) {
        console.error('[Admin deleteDeck] Error:', error);
        throw new Error(`Failed to delete deck: ${error.message}`);
    }
}
