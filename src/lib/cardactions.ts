'use server';

import { addDoc, collection, doc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';

// Function to add a new card to a deck
export async function addCard(deckId, cardData, cardImage) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to add a card.');
  }

  try {
    let imageUrl = '';
    // Upload the card image if one is provided
    if (cardImage) {
      const storageRef = ref(storage, `users/${user.uid}/decks/${deckId}/cards/${Date.now()}`);
      const uploadResult = await uploadString(storageRef, cardImage, 'data_url');
      imageUrl = await getDownloadURL(uploadResult.ref);
    }

    // Add the card to the 'cards' subcollection within the user's deck
    const cardCollectionRef = collection(db, 'users', user.uid, 'decks', deckId, 'cards');
    const docRef = await addDoc(cardCollectionRef, {
      ...cardData,
      imageUrl,
      createdAt: new Date(),
    });

    // Increment the card count on the deck document
    const deckRef = doc(db, 'users', user.uid, 'decks', deckId);
    await updateDoc(deckRef, {
        cardCount: increment(1)
    });

    return { id: docRef.id, ...cardData, imageUrl };

  } catch (error) {
    console.error('Error adding card:', error);
    throw new Error('Failed to add card.');
  }
}

// Function to update an existing card
export async function updateCard(deckId, cardId, cardData, newCardImage) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('You must be logged in to update a card.');
    }

    try {
        let imageUrl = cardData.imageUrl;

        // If a new image is uploaded, handle the upload and delete the old one
        if (newCardImage) {
            // Delete old image if it exists
            if (imageUrl) {
                try {
                    const oldImageRef = ref(storage, imageUrl);
                    await deleteObject(oldImageRef);
                } catch (deleteError) {
                    // It's okay if the old image doesn't exist, so we can ignore this error
                    console.warn("Old image not found or couldn't be deleted:", deleteError);
                }
            }
            
            // Upload new image
            const storageRef = ref(storage, `users/${user.uid}/decks/${deckId}/cards/${Date.now()}`);
            const uploadResult = await uploadString(storageRef, newCardImage, 'data_url');
            imageUrl = await getDownloadURL(uploadResult.ref);
        }

        // Update the card document in Firestore
        const cardRef = doc(db, 'users', user.uid, 'decks', deckId, 'cards', cardId);
        await updateDoc(cardRef, {
            ...cardData,
            imageUrl,
        });

        return { id: cardId, ...cardData, imageUrl };

    } catch (error) {
        console.error('Error updating card:', error);
        throw new Error('Failed to update card.');
    }
}
