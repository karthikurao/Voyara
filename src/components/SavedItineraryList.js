
"use client";

import { useEffect, useState } from 'react';
import ItineraryCard from '@/components/ItineraryCard';
import ShareButton from '@/components/ShareButton';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Trash2,
  Copy,
  Share2,
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Wallet,
  Compass,
  MapPin,
} from 'lucide-react';

export default function SavedItineraryList({ savedItineraries, onReload }) {
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [editTripId, setEditTripId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [showSharesId, setShowSharesId] = useState(null);
  const [metadataState, setMetadataState] = useState({});
  const [newPackingItem, setNewPackingItem] = useState({});
  const [newPrepTask, setNewPrepTask] = useState({});
  const [shares, setShares] = useState([]);
  const [loadingShares, setLoadingShares] = useState(false);

  useEffect(() => {
    const mapped = {};
    (savedItineraries || []).forEach((trip) => {
      mapped[trip.id] = trip.metadata || null;
    });
    setMetadataState(mapped);
  }, [savedItineraries]);

  const handleToggleExpand = (tripId) => {
    setExpandedTripId((prev) => (prev === tripId ? null : tripId));
    setEditTripId(null);
    setShowSharesId(null);
  };

  const handleEdit = (trip) => {
    setEditTripId(trip.id);
    setEditData(JSON.parse(JSON.stringify(trip.itinerary_data)));
  };

  const handleEditChange = (dayIdx, field, value) => {
    setEditData((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      copy.itinerary[dayIdx][field] = value;
      return copy;
    });
  };

  const getJWT = () => {
    const token = window.localStorage.getItem('voyaraAuthToken');
    if (!token) {
      throw new Error('Please log in to manage itineraries.');
    }
    return token;
  };

  const handleSaveEdit = async (trip) => {
    try {
      const jwt = getJWT();
      const res = await fetch('/api/itineraries/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ destination: trip.destination, itinerary_data: editData, context: trip.context }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to save');
      setEditTripId(null);
      setEditData(null);
      alert('Saved as new version!');
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to save: ' + err.message);
    }
  };

  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this itinerary?')) return;
    try {
      const jwt = getJWT();
      const res = await fetch('/api/itineraries/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ id: tripId }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to delete');
      alert('Deleted!');
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const handleDuplicate = async (trip) => {
    try {
      const jwt = getJWT();
      const res = await fetch('/api/itineraries/duplicate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ id: trip.id }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to duplicate');
      alert('Duplicated!');
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to duplicate: ' + err.message);
    }
  };

  const handleTogglePublic = async (trip) => {
    try {
      const jwt = getJWT();
      const res = await fetch('/api/itineraries/toggle-public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ id: trip.id, is_public: !trip.is_public }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to toggle');
      alert('Visibility updated!');
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to update visibility: ' + err.message);
    }
  };

  const updateMetadataOnServer = async (tripId, metadata) => {
    const jwt = getJWT();
    const res = await fetch('/api/itineraries/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ id: tripId, metadata, mode: 'replace' }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || 'Failed to update itinerary metadata');
  };

  const togglePackingItem = async (tripId, index) => {
    const current = metadataState[tripId];
    if (!current?.packingList) return;
    const updated = {
      ...current,
      packingList: current.packingList.map((entry, idx) =>
        idx === index ? { ...entry, checked: !entry.checked } : entry,
      ),
    };
    setMetadataState((prev) => ({ ...prev, [tripId]: updated }));
    try {
      await updateMetadataOnServer(tripId, updated);
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to update packing list: ' + err.message);
      setMetadataState((prev) => ({ ...prev, [tripId]: current }));
    }
  };

  const togglePrepTask = async (tripId, index) => {
    const current = metadataState[tripId];
    if (!current?.prepChecklist) return;
    const updated = {
      ...current,
      prepChecklist: current.prepChecklist.map((entry, idx) =>
        idx === index ? { ...entry, done: !entry.done } : entry,
      ),
    };
    setMetadataState((prev) => ({ ...prev, [tripId]: updated }));
    try {
      await updateMetadataOnServer(tripId, updated);
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to update prep checklist: ' + err.message);
      setMetadataState((prev) => ({ ...prev, [tripId]: current }));
    }
  };

  const addPackingItem = async (tripId) => {
    const label = (newPackingItem[tripId] || '').trim();
    if (!label) return;
    const current = metadataState[tripId] || {};
    const updated = {
      ...current,
      packingList: [...(current.packingList || []), { item: label, reason: 'Custom item', checked: false }],
    };
    setMetadataState((prev) => ({ ...prev, [tripId]: updated }));
    setNewPackingItem((prev) => ({ ...prev, [tripId]: '' }));
    try {
      await updateMetadataOnServer(tripId, updated);
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to add packing item: ' + err.message);
      setMetadataState((prev) => ({ ...prev, [tripId]: current }));
    }
  };

  const addPrepTask = async (tripId) => {
    const label = (newPrepTask[tripId] || '').trim();
    if (!label) return;
    const current = metadataState[tripId] || {};
    const updated = {
      ...current,
      prepChecklist: [...(current.prepChecklist || []), { task: label, reason: 'Custom task', done: false }],
    };
    setMetadataState((prev) => ({ ...prev, [tripId]: updated }));
    setNewPrepTask((prev) => ({ ...prev, [tripId]: '' }));
    try {
      await updateMetadataOnServer(tripId, updated);
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to add prep task: ' + err.message);
      setMetadataState((prev) => ({ ...prev, [tripId]: current }));
    }
  };

  const handleShowShares = async (tripId) => {
    const next = showSharesId === tripId ? null : tripId;
    setShowSharesId(next);
    setEditTripId(null);
    if (next) {
      setLoadingShares(true);
      try {
        const jwt = getJWT();
        const res = await fetch(`/api/itineraries/shares?id=${tripId}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error((await res.json())?.error || 'Failed to fetch shares');
        const data = await res.json();
        setShares(data.shares || []);
      } catch (err) {
        alert('Failed to fetch shares: ' + err.message);
        setShares([]);
      }
      setLoadingShares(false);
    }
  };

  const handleRevokeShare = async (token) => {
    if (!window.confirm('Revoke this share link?')) return;
    try {
      const jwt = getJWT();
      const res = await fetch('/api/itineraries/shares', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || 'Failed to revoke');
      alert('Share link revoked!');
      if (showSharesId) await handleShowShares(showSharesId);
      if (onReload) onReload();
    } catch (err) {
      alert('Failed to revoke: ' + err.message);
    }
  };

  const renderMetadataPanel = (trip) => {
    const metadata = metadataState[trip.id];
    if (!metadata) return null;

    return (
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-purple-300 font-semibold text-lg">
            <Compass className="w-5 h-5" />
            <span>Trip Snapshot</span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed">{metadata.summary}</p>
          <div className="flex flex-wrap gap-3 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1 bg-purple-800/50 px-2 py-1 rounded">
              <MapPin className="w-4 h-4" />
              {metadata.travelContext?.destination || trip.destination}
            </span>
            <span className="inline-flex items-center gap-1 bg-purple-800/50 px-2 py-1 rounded">
              <Wallet className="w-4 h-4" />
              ~{metadata.estimatedBudget?.currency || 'USD'} {metadata.estimatedBudget?.total || 0}
            </span>
            {metadata.travelContext?.vibes?.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-purple-800/50 px-2 py-1 rounded">
                {metadata.travelContext.vibes.join(', ')} vibes
              </span>
            )}
          </div>
          {metadata.highlights?.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-300 mb-2">Highlights</p>
              <ul className="space-y-1 text-sm text-gray-200">
                {metadata.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-start gap-2">
                    <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-purple-500" />
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-purple-300 font-semibold text-lg">
            <span>Packing Checklist</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-200 max-h-52 overflow-y-auto pr-1">
            {(metadata.packingList || []).map((entry, index) => (
              <li key={`${entry.item}-${index}`} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => togglePackingItem(trip.id, index)}
                  className="mt-0.5 text-purple-300 hover:text-purple-100"
                >
                  {entry.checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <div>
                  <p className="font-medium">{entry.item}</p>
                  <p className="text-xs text-gray-400">{entry.reason}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newPackingItem[trip.id] || ''}
              onChange={(e) => setNewPackingItem((prev) => ({ ...prev, [trip.id]: e.target.value }))}
              placeholder="Add custom item"
              className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => addPackingItem(trip.id)}
              className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>

        <div className="bg-gray-900/70 border border-white/10 rounded-lg p-4 space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between text-purple-300 font-semibold text-lg">
            <span>Pre-trip To-dos</span>
          </div>
          <ul className="space-y-2 text-sm text-gray-200">
            {(metadata.prepChecklist || []).map((entry, index) => (
              <li key={`${entry.task}-${index}`} className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => togglePrepTask(trip.id, index)}
                  className="mt-0.5 text-purple-300 hover:text-purple-100"
                >
                  {entry.done ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                </button>
                <div>
                  <p className="font-medium">{entry.task}</p>
                  <p className="text-xs text-gray-400">{entry.reason}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              value={newPrepTask[trip.id] || ''}
              onChange={(e) => setNewPrepTask((prev) => ({ ...prev, [trip.id]: e.target.value }))}
              placeholder="Add prep item"
              className="flex-1 rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={() => addPrepTask(trip.id)}
              className="bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {savedItineraries.map((trip) => (
        <div key={trip.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={() => handleToggleExpand(trip.id)}
            className="w-full p-4 sm:p-6 text-left bg-gray-700/50 hover:bg-gray-700/80 transition-colors focus:outline-none"
            aria-expanded={expandedTripId === trip.id}
            aria-controls={`trip-details-${trip.id}`}
          >
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-white">Trip to: {trip.destination}</h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  Saved on: {new Date(trip.created_at).toLocaleDateString()}
                  {trip.itinerary_data?.itinerary?.length > 0 &&
                    ` | ${trip.itinerary_data.itinerary.length} Day${trip.itinerary_data.itinerary.length > 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(trip)} title="Edit" className="p-2 rounded hover:bg-purple-700/30">
                  <Edit3 className="w-5 h-5 text-purple-400" />
                </button>
                <button onClick={() => handleDuplicate(trip)} title="Duplicate" className="p-2 rounded hover:bg-blue-700/30">
                  <Copy className="w-5 h-5 text-blue-400" />
                </button>
                <button onClick={() => handleDelete(trip.id)} title="Delete" className="p-2 rounded hover:bg-red-700/30">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </button>
                <button onClick={() => handleShowShares(trip.id)} title="Manage Shares" className="p-2 rounded hover:bg-green-700/30">
                  <Share2 className="w-5 h-5 text-green-400" />
                </button>
                <button onClick={() => handleTogglePublic(trip)} title="Toggle Public/Private" className="p-2 rounded hover:bg-gray-700/30">
                  {trip.is_public ? <Unlock className="w-5 h-5 text-yellow-400" /> : <Lock className="w-5 h-5 text-gray-400" />}
                </button>
                <ShareButton itineraryId={trip.id} destination={trip.destination} />
                {expandedTripId === trip.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-300" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-300" />
                )}
              </div>
            </div>
          </button>

          {expandedTripId === trip.id && (
            <div id={`trip-details-${trip.id}`} className="p-4 sm:p-6 border-t border-gray-700">
              {renderMetadataPanel(trip)}

              {editTripId === trip.id && editData ? (
                <div className="space-y-6">
                  {editData.itinerary.map((day, dayIdx) => (
                    <div key={dayIdx} className="mb-4">
                      <input
                        type="text"
                        value={day.day}
                        onChange={(e) => handleEditChange(dayIdx, 'day', e.target.value)}
                        className="w-full mb-2 p-2 rounded bg-gray-900 text-white border border-purple-400"
                      />
                      {day.timeline.map((item, itemIdx) => (
                        <div key={itemIdx} className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={item.time}
                            onChange={(e) => {
                              const copy = JSON.parse(JSON.stringify(editData));
                              copy.itinerary[dayIdx].timeline[itemIdx].time = e.target.value;
                              setEditData(copy);
                            }}
                            className="w-24 p-1 rounded bg-gray-900 text-white border border-purple-400"
                          />
                          <input
                            type="text"
                            value={item.activity}
                            onChange={(e) => {
                              const copy = JSON.parse(JSON.stringify(editData));
                              copy.itinerary[dayIdx].timeline[itemIdx].activity = e.target.value;
                              setEditData(copy);
                            }}
                            className="flex-1 p-1 rounded bg-gray-900 text-white border border-purple-400"
                          />
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => {
                              const copy = JSON.parse(JSON.stringify(editData));
                              copy.itinerary[dayIdx].timeline[itemIdx].description = e.target.value;
                              setEditData(copy);
                            }}
                            className="flex-1 p-1 rounded bg-gray-900 text-white border border-purple-400"
                          />
                        </div>
                      ))}
                      <div className="mt-2">
                        <input
                          type="text"
                          value={day.food_suggestion?.name || ''}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(editData));
                            copy.itinerary[dayIdx].food_suggestion.name = e.target.value;
                            setEditData(copy);
                          }}
                          className="w-1/2 p-1 rounded bg-gray-900 text-white border border-green-400"
                          placeholder="Food name"
                        />
                        <input
                          type="text"
                          value={day.food_suggestion?.description || ''}
                          onChange={(e) => {
                            const copy = JSON.parse(JSON.stringify(editData));
                            copy.itinerary[dayIdx].food_suggestion.description = e.target.value;
                            setEditData(copy);
                          }}
                          className="w-1/2 p-1 rounded bg-gray-900 text-white border border-green-400"
                          placeholder="Food description"
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => handleSaveEdit(trip)} className="bg-purple-600 text-white px-4 py-2 rounded">
                      Save as New Version
                    </button>
                    <button
                      onClick={() => {
                        setEditTripId(null);
                        setEditData(null);
                      }}
                      className="bg-gray-600 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                trip.itinerary_data &&
                trip.itinerary_data.itinerary?.map((dayData, index) => <ItineraryCard key={index} dayData={dayData} />)
              )}

              {showSharesId === trip.id && (
                <div className="mt-6 p-4 bg-gray-900 rounded border border-green-400">
                  <h3 className="text-lg font-bold text-green-400 mb-2">Manage Share Links</h3>
                  {loadingShares ? (
                    <p className="text-gray-300">Loading...</p>
                  ) : shares.length === 0 ? (
                    <p className="text-gray-300">No active share links.</p>
                  ) : (
                    <ul className="space-y-2">
                      {shares.map((s) => (
                        <li key={s.token} className="flex items-center gap-3">
                          <span className="text-xs text-gray-200 break-all">{s.token}</span>
                          <span className="text-xs text-gray-400">Created: {new Date(s.created_at).toLocaleString()}</span>
                          <button onClick={() => handleRevokeShare(s.token)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}