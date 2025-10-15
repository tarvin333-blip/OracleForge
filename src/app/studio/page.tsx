'use client';

import { useState, useEffect, useCallback } from 'react';
import { createDeck, updateDeck, deleteDeck } from '../../lib/deckactions';
import { addCard, updateCard, deleteCard, deleteCardImage } from '../../lib/cardactions';
import { PlusCircle, ArrowLeft, Upload, Pencil, X, Trash2, AlertTriangle } from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Main Page Component
export default function StudioPage() {
  const [user, setUser] = useState(null);
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [view, setView] = useState('decks'); // 'decks', 'cards', 'createDeck', 'editDeck', 'editCard'
  const [editingDeck, setEditingDeck] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null); // { type: 'deck'/'card'/'cardImage', data: {...} }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setDecks([]);
        setCards([]);
        setSelectedDeck(null);
        setView('decks');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'users', user.uid, 'decks'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const decksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDecks(decksData);
      }, (error) => setActionError(`Failed to load decks: ${error.message}`));
      return () => unsubscribe();
    } else {
      setDecks([]);
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedDeck) {
      const q = query(collection(db, 'users', user.uid, 'decks', selectedDeck.id, 'cards'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const cardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCards(cardsData);
      }, (error) => setActionError(`Failed to load cards: ${error.message}`));
      return () => unsubscribe();
    } else {
      setCards([]);
    }
  }, [user, selectedDeck]);

  const handleError = (error, message = 'An unexpected error occurred.') => {
    console.error(message, error);
    setActionError(error.message || message);
  };

  const handleConfirmDelete = async () => {
    if (!user || !itemToDelete) return;
    setActionError(null);
    const { type, data } = itemToDelete;
    try {
      if (type === 'deck') {
        await deleteDeck(user.uid, data.id);
        if (selectedDeck?.id === data.id) {
          setSelectedDeck(null);
          setView('decks');
        }
      } else if (type === 'card') {
        await deleteCard(user.uid, selectedDeck.id, data.id);
        setView('cards'); // Go back to card list view after deletion
      } else if (type === 'cardImage') {
        await deleteCardImage(user.uid, selectedDeck.id, data.id);
        // Update the state of the card being edited to remove the image URL
        if (editingCard?.id === data.id) {
            setEditingCard(prev => ({...prev, imageUrl: null}));
        }
      }
    } catch (error) {
      handleError(error, `Failed to delete ${type}.`);
    } finally {
      setItemToDelete(null); // Close modal
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'createDeck':
        return <DeckForm 
          deck={null}
          onClose={() => setView('decks')} 
          onSave={async (name, image) => {
            try { await createDeck(user.uid, name, image); setView('decks'); } 
            catch (error) { handleError(error, 'Failed to create deck.'); }
          }} 
        />;
      case 'editDeck':
        return <DeckForm 
          deck={editingDeck} 
          onClose={() => setView('decks')} 
          onSave={async (name, image, oldData) => {
            try { await updateDeck(user.uid, editingDeck.id, name, image, oldData); setView('decks'); }
            catch (error) { handleError(error, 'Failed to update deck.'); }
          }} 
        />;
      case 'editCard':
        return <CardEditor 
          card={editingCard} 
          deck={selectedDeck} 
          onClose={() => setView('cards')} 
          onSave={async (cardData, image) => {
            try {
              if (cardData.id) {
                await updateCard(user.uid, selectedDeck.id, cardData.id, cardData, image);
              } else {
                await addCard(user.uid, selectedDeck.id, cardData, image);
              }
              setView('cards');
            } catch(error) { handleError(error, 'Failed to save card.'); }
          }}
          onRequestDelete={(card) => setItemToDelete({ type: 'card', data: card })}
          onRequestDeleteImage={(card) => setItemToDelete({ type: 'cardImage', data: card })}
        />;
      case 'cards':
        return <CardGridView 
          deck={selectedDeck} 
          cards={cards} 
          onBack={() => { setSelectedDeck(null); setView('decks'); }}
          onEditCard={(card) => { setEditingCard(card); setView('editCard'); }} 
        />;
      default:
        return <DeckListView 
          decks={decks} 
          onSelectDeck={(deck) => { setSelectedDeck(deck); setView('cards'); }}
          onCreateDeck={() => setView('createDeck')}
          onEditDeck={(deck) => { setEditingDeck(deck); setView('editDeck'); }}
          onRequestDelete={(deck) => setItemToDelete({ type: 'deck', data: deck })}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8 bg-grid-white/[0.05]">
      <div className="max-w-7xl mx-auto">
        {actionError && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-6 flex justify-between items-start shadow-lg">
                <pre className="whitespace-pre-wrap text-sm">{actionError}</pre>
                <button onClick={() => setActionError(null)} className="p-1 -mt-1 -mr-1 rounded-full hover:bg-red-800/50 transition-colors"><X size={20} /></button>
            </div>
        )}
        {renderContent()}
        <ConfirmationModal
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          item={itemToDelete}
        />
      </div>
    </div>
  );
}

// Generic Deletion Confirmation Modal
function ConfirmationModal({ isOpen, onClose, onConfirm, item }) {
  if (!isOpen) return null;

  const titles = {
    deck: 'Delete Deck?',
    card: 'Delete Card?',
    cardImage: 'Delete Image?'
  };
  const messages = {
    deck: `Are you sure you want to permanently delete the deck "${item?.data?.name || 'Untitled Deck'}"? All of its cards will be lost forever. This action cannot be undone.`,
    card: `Are you sure you want to permanently delete the card "${item?.data?.name || 'Untitled Card'}"? This action cannot be undone.`,
    cardImage: 'Are you sure you want to permanently delete this image? This action cannot be undone.'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="relative bg-gray-800/80 border border-gray-700/80 rounded-2xl shadow-2xl p-6 w-full max-w-md m-4" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start">
          <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <AlertTriangle className="h-6 w-6 text-red-400" aria-hidden="true" />
          </div>
          <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-white">{titles[item?.type]}</h3>
              <div className="mt-2">
                  <p className="text-sm text-gray-300">{messages[item?.type]}</p>
              </div>
          </div>
        </div>
        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
          <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors" onClick={onConfirm}>Delete</button>
          <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-700 text-base font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function DeckListView({ decks, onSelectDeck, onCreateDeck, onEditDeck, onRequestDelete }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">Creator Studio</h1>
        <button onClick={onCreateDeck} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all duration-300"><PlusCircle size={20} /><span>New Deck</span></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {decks.map((deck) => (
          <div key={deck.id} className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden group relative transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105">
            <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={(e) => { e.stopPropagation(); onEditDeck(deck); }} className="p-1.5 bg-gray-900/60 rounded-full text-gray-300 hover:bg-gray-700 hover:text-white"><Pencil size={16} /></button>
              <button onClick={(e) => { e.stopPropagation(); onRequestDelete(deck); }} className="p-1.5 bg-red-900/60 rounded-full text-red-300 hover:bg-red-700 hover:text-white"><Trash2 size={16} /></button>
            </div>
            <div onClick={() => onSelectDeck(deck)}>
              <div className="w-full h-48 bg-center bg-contain bg-no-repeat bg-gray-700 cursor-pointer" style={{ backgroundImage: `url(${deck.cardBack || deck.cardBackingUrl || ''})` }}></div>
              <div className="p-4 cursor-pointer">
                <h3 className="text-lg font-bold text-gray-100">{deck.name || 'Untitled Deck'}</h3>
                <p className="text-sm text-gray-400">{deck.cardCount || 0} cards</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardGridView({ deck, cards, onBack, onEditCard }) {
  return (
    <div>
        <div className="flex items-center mb-8">
            <button onClick={onBack} className="flex items-center gap-2 mr-4 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={16} /><span>Back to Decks</span></button>
            <h2 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400">{deck.name || 'Untitled Deck'}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cards.map((card) => (
                <div key={card.id} onClick={() => onEditCard(card)} className="bg-gray-800/50 rounded-lg shadow-lg overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-indigo-500/40 hover:scale-105">
                    <div className="w-full aspect-[2/3] bg-center bg-contain bg-no-repeat bg-gray-700" style={{ backgroundImage: `url(${card.imageUrl || ''})` }}></div>
                    <div className="p-3"><h4 className="font-bold text-gray-100 truncate">{card.name}</h4></div>
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

// Combined DeckCreationForm and DeckEditor
function DeckForm({ deck, onClose, onSave }) {
  const isEditing = !!deck;
  const [name, setName] = useState(isEditing ? deck.name : '');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(isEditing ? (deck.cardBack || deck.cardBackingUrl) : '');
  const [isDragging, setIsDragging] = useState(false);

  const processFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handlePaste = useCallback((e) => {
    const file = e.clipboardData.files[0];
    if (file) { e.preventDefault(); processFile(file); }
  }, [processFile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if(isEditing) {
      onSave(name, image, { cardBackingUrl: deck.cardBack || deck.cardBackingUrl });
    } else {
       if (!image) { alert('A card back image is required.'); return; }
      onSave(name, image);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10" onPaste={handlePaste}>
      <form onSubmit={handleSubmit} className="bg-gray-800/60 p-8 rounded-xl shadow-2xl shadow-indigo-500/10 space-y-6">
        <h2 className="text-2xl font-bold text-white mb-6">{isEditing ? 'Edit Deck' : 'Create New Deck'}</h2>
        <div>
          <label htmlFor="deckName" className="block text-sm font-medium text-gray-300 mb-2">Deck Name</label>
          <input type="text" id="deckName" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2" placeholder="e.g., 'Celestial Visions'" required />
        </div>
        <ImageUploader 
          isDragging={isDragging} 
          setIsDragging={setIsDragging} 
          processFile={processFile} 
          preview={preview} 
          text='Card Back Image' 
          aspect='aspect-[16/9]'
        />
        <div className="flex justify-end gap-4">
          <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition">Cancel</button>
          <button type="submit" className="py-2 px-4 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 shadow-lg">{isEditing ? 'Save Changes' : 'Create Deck'}</button>
        </div>
      </form>
    </div>
  );
}

function CardEditor({ card, deck, onClose, onSave, onRequestDelete, onRequestDeleteImage }) {
  const [name, setName] = useState(card.name || '');
  const [meaning, setMeaning] = useState(card.meaning || '');
  const [image, setImage] = useState(null); // New image file to be uploaded
  const [preview, setPreview] = useState(card.imageUrl || ''); // Image to display
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    // When the card prop changes (e.g., after a server-side image deletion),
    // update the preview to match it.
    setPreview(card.imageUrl || '');
    setImage(null); // Clear any staged new image
  }, [card.imageUrl]);

  const processFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Stage new image for upload
        setPreview(reader.result); // Show new image preview
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleImageDelete = () => {
    if (card.id && card.imageUrl) {
      // Image is on the server, ask for confirmation
      onRequestDeleteImage(card);
    } else {
      // Image is only local (a preview), just clear it
      setImage(null);
      setPreview('');
    }
  };

  const handlePaste = useCallback((e) => {
    const file = e.clipboardData.files[0];
    if (file) { e.preventDefault(); processFile(file); }
  }, [processFile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...card, name, meaning }, image);
  };

  return (
    <div className="max-w-4xl mx-auto my-10" onPaste={handlePaste}>
      <button onClick={onClose} className="flex items-center gap-2 mb-6 text-gray-400 hover:text-white"><ArrowLeft size={16} /><span>Back to {deck.name || 'Deck'}</span></button>
      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Card Image</h3>
          <div className="relative">
            <ImageUploader 
              isDragging={isDragging} 
              setIsDragging={setIsDragging} 
              processFile={processFile} 
              preview={preview} 
              text='Card Face Image' 
              aspect='aspect-[2/3]'
            />
            {preview && (
              <button type='button' onClick={handleImageDelete} className='absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white/80 hover:bg-black/70 hover:text-white'>
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-2">Card Name</label>
            <input type="text" id="cardName" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2" placeholder="e.g., 'The Wanderer'" required />
          </div>
          <div>
            <label htmlFor="cardMeaning" className="block text-sm font-medium text-gray-300 mb-2">Card Meaning</label>
            <textarea id="cardMeaning" value={meaning} onChange={(e) => setMeaning(e.target.value)} rows={8} className="w-full bg-gray-900/50 border border-gray-700 rounded-md p-2" placeholder="Describe the symbolism..."></textarea>
          </div>
          <div className="pt-4 flex justify-between items-center">
            {card.id && (
              <button type="button" onClick={() => onRequestDelete(card)} className="text-red-400 hover:text-red-300 font-semibold transition-colors">Delete Card</button>
            )}
            <button type="submit" className="py-2 px-5 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 ml-auto">Save Card</button>
          </div>
        </div>
      </form>
    </div>
  );
}

// Generic Image Uploader Component
function ImageUploader({ isDragging, setIsDragging, processFile, preview, text, aspect }) {
  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };
  const handleUpload = (e) => processFile(e.target.files[0]);

  return (
    <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">{text}</label>
        <div 
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`w-full ${aspect} bg-gray-800 rounded-lg flex items-center justify-center bg-contain bg-no-repeat bg-center border-2 border-dashed transition-all ${isDragging ? 'border-indigo-500' : 'border-gray-700'}`}
          style={{ backgroundImage: preview ? `url(${preview})` : 'none' }}
        >
          {!preview && (
              <div className="text-center text-gray-400 p-4">
                  <Upload size={40} className="mx-auto"/>
                  <p className="mt-2 text-sm">Drop image, <label htmlFor="file-upload" className="cursor-pointer font-semibold text-indigo-400 hover:text-indigo-500">upload</label>, or paste</p>
                  <input id="file-upload" type="file" onChange={handleUpload} className="sr-only" />
              </div>
          )}
        </div>
    </div>
  )
}
