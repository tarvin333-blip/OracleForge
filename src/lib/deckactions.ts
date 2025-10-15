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

export async function updateDeck(uid, deckId, deckName, newCardBackImage) {
    if (!uid || !deckId) throw new Error('User UID and Deck ID are required.');

    try {
        const docRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks')).doc(deckId);
        const updateData = { name: deckName };

        if (newCardBackImage) {
            const imagePath = `users/${uid}/decks/${deckId}/card-back-${Date.now()}`;
            const newImageUrl = await uploadImageAsAdmin(imagePath, newCardBackImage);
            updateData.cardBack = newImageUrl;
            updateData.cardBackingUrl = newImageUrl; // Ensure compatibility
        }

        await docRef.update(updateData);

        return { success: true };

    } catch (error) {
        console.error('[Admin updateDeck] Error:', error);
        throw new Error(`Failed to update deck using admin privileges: ${error.message}`);
    }
}
