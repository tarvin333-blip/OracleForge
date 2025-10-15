'use server';

import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

export async function createDeck(uid, deckName, cardBackImage) {
  if (!uid) {
    throw new Error('You must be logged in to create a deck.');
  }

  try {
    const storageRef = ref(storage, `users/${uid}/decks/${Date.now()}/card-back`);
    const uploadResult = await uploadString(storageRef, cardBackImage, 'data_url');
    const imageUrl = await getDownloadURL(uploadResult.ref);

    const docRef = await addDoc(collection(db, 'users', uid, 'decks'), {
      name: deckName,
      cardBack: imageUrl,
      cardCount: 0,
      createdAt: new Date(),
      userId: uid,
    });

    return { id: docRef.id, name: deckName, cardBack: imageUrl, cardCount: 0 };

  } catch (error) {
    console.error('[createDeck] Detailed Firebase Error:', error);
    throw new Error(`Failed to create deck. Original error: ${error.message}`);
  }
}

export async function updateDeck(uid, deckId, deckName, newCardBackImage, oldDeckData) {
    if (!uid) {
        throw new Error('You must be logged in to update a deck.');
    }

    try {
        const updateData = {
            name: deckName,
        };

        if (newCardBackImage) {
            const storageRef = ref(storage, `users/${uid}/decks/${deckId}/card-back-${Date.now()}`);
            const uploadResult = await uploadString(storageRef, newCardBackImage, 'data_url');
            const newImageUrl = await getDownloadURL(uploadResult.ref);
            updateData.cardBack = newImageUrl;
            updateData.cardBackingUrl = newImageUrl; // Ensure compatibility
        }

        const deckRef = doc(db, 'users', uid, 'decks', deckId);
        await updateDoc(deckRef, updateData);

        // The problematic image deletion logic has been completely removed to ensure stability.

        return { success: true };

    } catch (error) {
        console.error('[updateDeck] Detailed Firebase Error:', error);
        throw new Error(`Update failed. Original error: ${error.message}`);
    }
}
