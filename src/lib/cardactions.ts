'use server';

import { adminDb, adminStorage } from './firebase-admin';
import { Buffer } from 'buffer';

// Re-usable helper function to upload images using the Admin SDK
async function uploadImageAsAdmin(filePath, imageDataUrl) {
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
        return null; // Return null if no new image is provided
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
    
    // Get a long-lived signed URL
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491'
    });
    
    return url;
}

export async function addCard(uid, deckId, cardData, cardImage) {
    if (!uid || !deckId) throw new Error('User and Deck IDs are required.');

    try {
        const cardsCollectionRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks')).doc(deckId).collection('cards');
        const cardDocRef = cardsCollectionRef.doc(); // Create a new doc ref to get an ID

        let imageUrl = null;
        if (cardImage) {
            const imagePath = `users/${uid}/decks/${deckId}/cards/${cardDocRef.id}`;
            imageUrl = await uploadImageAsAdmin(imagePath, cardImage);
        }

        const finalCardData = {
            ...cardData,
            name: cardData.name || 'Untitled Card',
            meaning: cardData.meaning || '',
            imageUrl: imageUrl || null,
            createdAt: new Date().toISOString(),
        };
        delete finalCardData.id; // Remove temporary ID if it exists

        await cardDocRef.set(finalCardData);

        // Increment card count
        const deckRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks')).doc(deckId);
        const deckDoc = await deckRef.get();
        const currentCardCount = deckDoc.data()?.cardCount || 0;
        await deckRef.update({ cardCount: currentCardCount + 1 });

        return { id: cardDocRef.id };

    } catch (error) {
        console.error('[Admin addCard] Error:', error);
        throw new Error(`Failed to add card using admin privileges: ${error.message}`);
    }
}

export async function updateCard(uid, deckId, cardId, cardData, newCardImage) {
    if (!uid || !deckId || !cardId) throw new Error('User, Deck, and Card IDs are required.');

    try {
        const cardRef = adminDb.collection('users'.concat("/").concat(uid).concat("/").concat('decks')).doc(deckId).collection('cards').doc(cardId);
        const updateData = { ...cardData };

        if (newCardImage) {
            const imagePath = `users/${uid}/decks/${deckId}/cards/${cardId}-${Date.now()}`;
            const newImageUrl = await uploadImageAsAdmin(imagePath, newCardImage);
            updateData.imageUrl = newImageUrl;
        }

        delete updateData.id; // Don't save the ID field within the document

        await cardRef.update(updateData);

        return { success: true };

    } catch (error) {
        console.error('[Admin updateCard] Error:', error);
        throw new Error(`Failed to update card using admin privileges: ${error.message}`);
    }
}
