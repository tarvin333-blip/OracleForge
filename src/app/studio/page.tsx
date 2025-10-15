"use client";

import { useState, useEffect } from 'react';
import { createDeck, updateDeck } from '../../lib/deckactions';
import { addCard, updateCard } from '../../lib/cardactions';
import { PlusCircle, ArrowLeft, Upload, Camera, Pencil, X } from 'lucide-react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function StudioPage() {
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [isEditingDeck, setIsEditingDeck] = useState(null);
  const [isEditingCard, setIsEditingCard] = useState(null);
  const [user, setUser] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
        setDecks([]);
        setCards([]);
        setSelectedDeck(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch decks
  useEffect(() => {
    if (user) {
      const decksCollectionRef = collection(db, 'users', user.uid, 'decks');
      const q = query(decksCollectionRef);
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const decksData = [];
        querySnapshot.forEach((doc) => {
          decksData.push({ id: doc.id, ...doc.data() });
        });
        setDecks(decksData);
      }, (error) => {
          console.error("Error fetching decks: ", error);
          setActionError(`Could not load decks: ${error.message}`);
      });
      return () => unsubscribe();
    } else {
      setDecks([]);
    }
  }, [user]);

  // Effect to fetch cards for the selected deck
  useEffect(() => {
    if (!user || !selectedDeck) {
        setCards([]);
        return;
    }

    if (Array.isArray(selectedDeck.cards)) {
        const cardsWithIds = selectedDeck.cards.map((card, index) => ({ ...card, id: card.id || index.toString() }));
        setCards(cardsWithIds);
        return;
    }

    const cardsSubcollectionRef = collection(db, 'users', user.uid, 'decks', selectedDeck.id, 'cards');
    const q = query(cardsSubcollectionRef);
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const cardsData = [];
        querySnapshot.forEach((doc) => {
            cardsData.push({ id: doc.id, ...doc.data() });
        });
        setCards(cardsData);
    }, (error) => {
        console.error("Error fetching cards: ", error);
        setActionError(`Could not load cards: ${error.message}`);
    });

    return () => unsubscribe();

  }, [user, selectedDeck]);

  const handleSelectDeck = (deck) => setSelectedDeck(deck);
  const handleBackToDecks = () => setSelectedDeck(null);
  
  const handleOpenCreateDeck = () => {
      setActionError(null);
      setIsCreatingDeck(true);
  }
  const handleCloseCreateDeck = () => setIsCreatingDeck(false);

  const handleOpenEditDeck = (deck) => {
      setActionError(null);
      setIsEditingDeck(deck);
  }
  const handleCloseEditDeck = () => setIsEditingDeck(null);

  const handleOpenEditCard = (card) => {
      setActionError(null);
      setIsEditingCard(card);
  }
  const handleCloseCardEditor = () => setIsEditingCard(null);

  const handleCreateDeck = async (deckName, cardBackImage) => {
    if (!user) return;
    setActionError(null);
    try {
      await createDeck(user.uid, deckName, cardBackImage);
      handleCloseCreateDeck();
    } catch (error) {
      console.error("Create Deck Error:", error);
      setActionError(error.message);
    }
  };

  const handleUpdateDeck = async (deckId, deckName, newCardBackImage, oldDeckData) => {
      if (!user) return;
      setActionError(null);
      try {
          const oldDeckPlainData = {
              cardBack: oldDeckData.cardBack || null,
              cardBackingUrl: oldDeckData.cardBackingUrl || null
          }
          await updateDeck(user.uid, deckId, deckName, newCardBackImage, oldDeckPlainData);
          handleCloseEditDeck();
      } catch (error) {
          console.error("Update Deck Error:", error);
          setActionError(error.message);
      }
  }

  const handleSaveCard = async (cardData, cardImage) => {
    if (!user) return;
    setActionError(null);
    try {
      if (selectedDeck && Array.isArray(selectedDeck.cards)) {
          alert("Card editing is not supported for older decks. Please create a new deck.");
          return;
      }
      
      if (cardData.id) {
        await updateCard(user.uid, selectedDeck.id, cardData.id, cardData, cardImage);
      } else {
        await addCard(user.uid, selectedDeck.id, cardData, cardImage);
      }
      handleCloseCardEditor();
    } catch (error) {
      console.error("Save Card Error:", error);
      setActionError(error.message);
    }
  };

  const mainContent = () => {
      if (isCreatingDeck) {
        return <DeckCreationForm onClose={handleCloseCreateDeck} onCreate={handleCreateDeck} />;
      }

      if (isEditingDeck) {
          return <DeckEditor deck={isEditingDeck} onClose={handleCloseEditDeck} onSave={handleUpdateDeck} />
      }

      if (isEditingCard) {
        return <CardEditor card={isEditingCard} onClose={handleCloseCardEditor} onSave={handleSaveCard} deck={selectedDeck} />;
      }

      if (!selectedDeck) {
          return <DeckListView decks={decks} onSelectDeck={handleSelectDeck} onCreateDeck={handleOpenCreateDeck} onEditDeck={handleOpenEditDeck} />
      }

      return <CardGridView deck={selectedDeck} cards={cards} onBack={handleBackToDecks} onEditCard={handleOpenEditCard} />
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 bg-grid-white/[0.05]">
      <div className="max-w-7xl mx-auto">
        {actionError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 flex justify-between items-start shadow-lg">
                <pre className="whitespace-pre-wrap text-sm">{actionError}</pre>
                <button onClick={() => setActionError(null)} className="p-1 -mt-1 -mr-1 rounded-full hover:bg-red-800/50 transition-colors">
                    <X size={20} />
                </button>
            </div>
        )}
        {mainContent()}
      </div>
    </div>
  );
}

// ... (The rest of the components remain the same) ...

function DeckListView({ decks, onSelectDeck, onCreateDeck, onEditDeck }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
          Creator Studio
        </h1>
        <button 
          onClick={onCreateDeck}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300">
          <PlusCircle size={20} />
          <span>New Deck</span>
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {decks.map((deck) => {
          const imageUrl = deck.cardBack || deck.cardBackingUrl;
          return (
            <div
              key={deck.id}
              className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden group relative transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105"
            >
                <button 
                    onClick={(e) => { e.stopPropagation(); onEditDeck(deck); }}
                    className="absolute top-2 right-2 z-10 p-1.5 bg-gray-900/50 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Edit Deck"
                >
                    <Pencil size={16} />
                </button>
              <div onClick={() => onSelectDeck(deck)} className="w-full h-48 bg-center bg-cover bg-gray-700 cursor-pointer" style={{ backgroundImage: `url(${imageUrl})` }}></div>
              <div onClick={() => onSelectDeck(deck)} className="p-4 cursor-pointer">
                <h3 className="text-lg font-bold text-gray-100">{deck.name || 'Untitled Deck'}</h3>
                <p className="text-sm text-gray-400">{deck.cardCount || (Array.isArray(deck.cards) ? deck.cards.length : 0)} cards</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

function CardGridView({ deck, cards, onBack, onEditCard }) {
    return (
        <div>
            <div className="flex items-center mb-8">
                <button onClick={onBack} className="flex items-center gap-2 mr-4 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} />
                    <span>Back to Decks</span>
                </button>
                <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">
                    {deck.name || 'Untitled Deck'}
                </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {cards.map((card) => (
                    <div key={card.id} onClick={() => onEditCard(card)} className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105">
                        <div className="w-full aspect-[2/3] bg-center bg-cover bg-gray-700" style={{ backgroundImage: `url(${card.imageUrl})` }}></div>
                        <div className="p-3">
                            <h4 className="font-bold text-gray-100 truncate">{card.name}</h4>
                        </div>
                    </div>
                ))}
                 <div onClick={() => onEditCard({})} className="flex items-center justify-center bg-gray-800/50 rounded-lg shadow-inner cursor-pointer group border-2 border-dashed border-gray-600 hover:border-indigo-500 transition-all duration-300 aspect-[2/3]">
                     <div className="text-center">
                        <PlusCircle size={32} className="mx-auto text-gray-500 group-hover:text-indigo-400" />
                        <p className="mt-2 text-sm font-semibold text-gray-400 group-hover:text-white">Add Card</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeckEditor({ deck, onClose, onSave }) {
    const [deckName, setDeckName] = useState(deck.name || '');
    const [newCardBackImage, setNewCardBackImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(deck.cardBack || deck.cardBackingUrl || '');
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewCardBackImage(reader.result);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = (e) => processFile(e.target.files[0]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(deck.id, deckName, newCardBackImage, deck);
    };

    return (
        <div className="max-w-2xl mx-auto my-10 bg-gray-800/60 p-8 rounded-xl shadow-2xl shadow-indigo-500/10">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Deck</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-2">Deck Name</label>
                    <input type="text" id="deckName" value={deckName} onChange={(e) => setDeckName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., 'Celestial Visions'" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Card Back Image</label>
                    <div className="mt-2 w-full aspect-[16/9] rounded-lg bg-gray-700 bg-cover bg-center" style={{ backgroundImage: `url(${imagePreview})` }}></div>
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`mt-4 flex justify-center rounded-lg border border-dashed px-6 py-10 transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-900/10' : 'border-gray-600 hover:border-indigo-500'}`}>
                        <div className="text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-500" />
                            <div className="mt-4 flex text-sm leading-6 text-gray-400">
                                <label htmlFor="file-upload-editor" className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-500">
                                    <span>Upload a new image</span>
                                    <input id="file-upload-editor" name="file-upload" type="file" onChange={handleImageUpload} className="sr-only" />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition">Cancel</button>
                    <button type="submit" className="py-2 px-4 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg hover:shadow-green-500/50 transition-all">Save Changes</button>
                </div>
            </form>
        </div>
    );
}


function DeckCreationForm({ onClose, onCreate }) {
  const [deckName, setDeckName] = useState('');
  const [cardBackImage, setCardBackImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (file) => {
      if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setCardBackImage(reader.result);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleImageUpload = (e) => processFile(e.target.files[0]);

  const handleDragOver = (e) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!cardBackImage) {
        alert("Please upload a card back image.");
        return;
    }
    onCreate(deckName, cardBackImage);
  };

  return (
    <div className="max-w-2xl mx-auto my-10 bg-gray-800/60 p-8 rounded-xl shadow-2xl shadow-indigo-500/10">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Deck</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-2">Deck Name</label>
                <input type="text" id="deckName" value={deckName} onChange={(e) => setDeckName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., 'Celestial Visions'" required />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Card Back Image</label>
                <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 transition-all duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-900/10' : 'border-gray-600 hover:border-indigo-500'}`}>
                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-500" />
                        <div className="mt-4 flex text-sm leading-6 text-gray-400">
                            <label htmlFor="file-upload-creation" className="relative cursor-pointer rounded-md font-semibold text-indigo-400 hover:text-indigo-500">
                                <span>Upload a file</span>
                                <input id="file-upload-creation" name="file-upload" type="file" onChange={handleImageUpload} className="sr-only" />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
            </div>
        <div className="mt-8 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition">Cancel</button>
            <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/50 transition-all">Create Deck</button>
        </div>
        </form>
    </div>
  )
}

function CardEditor({ card, onClose, onSave, deck }) {
    const [cardName, setCardName] = useState(card.name || '');
    const [cardMeaning, setCardMeaning] = useState(card.meaning || '');
    const [cardImage, setCardImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(card.imageUrl || '');
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCardImage(reader.result);
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageUpload = (e) => processFile(e.target.files[0]);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        processFile(e.dataTransfer.files[0]);
    };


    const handleSubmit = (e) => {
        e.preventDefault();
        // The card object passed to onSave should not contain complex objects.
        const cardDataToSave = { 
            ...card, 
            name: cardName, 
            meaning: cardMeaning 
        };
        onSave(cardDataToSave, cardImage);
    };

    return (
        <div className="max-w-4xl mx-auto my-10 bg-gray-800/60 p-8 rounded-xl shadow-2xl shadow-indigo-500/10">
            <button onClick={onClose} className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white transition-colors">
                <ArrowLeft size={16} />
                <span>Back to {deck.name || 'Deck'}</span>
            </button>
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
                {/* Left side - Image upload */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-white">Card Image</h3>
                    <div 
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`aspect-[2/3] w-full bg-gray-800 rounded-lg flex items-center justify-center bg-cover bg-center border-2 border-dashed transition-all ${isDragging ? 'border-indigo-500' : 'border-gray-700'}`}
                        style={{ backgroundImage: `url(${imagePreview})` }}
                    >
                        {!imagePreview && (
                            <div className="text-center text-gray-400">
                                <Upload size={40} className="mx-auto"/>
                                <p className="mt-2">Drop image here or</p>
                                 <label htmlFor="card-image-upload" className="cursor-pointer font-semibold text-indigo-400 hover:text-indigo-500">
                                    upload
                                    <input id="card-image-upload" type="file" onChange={handleImageUpload} className="sr-only" />
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side - Card details */}
                <div className="space-y-6">
                    <div>
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-2">Card Name</label>
                        <input type="text" id="cardName" value={cardName} onChange={(e) => setCardName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="e.g., 'The Wanderer'" required />
                    </div>
                    <div>
                        <label htmlFor="cardMeaning" className="block text-sm font-medium text-gray-300 mb-2">Card Meaning</label>
                        <textarea id="cardMeaning" value={cardMeaning} onChange={(e) => setCardMeaning(e.target.value)} rows={8} className="w-full bg-gray-900/50 border border-gray-700 text-white rounded-md p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition" placeholder="Describe the card's symbolism and interpretation..."></textarea>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className="py-2 px-5 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg hover:shadow-green-500/50 transition-all">Save Card</button>
                    </div>
                </div>
            </form>
        </div>
    )
}
