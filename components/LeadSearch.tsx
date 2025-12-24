
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Globe, Briefcase, Linkedin, BookOpen, Share2, Database } from 'lucide-react';
import { searchForLeads } from '../services/geminiService';
import { Lead, LeadStatus, LeadSourceType } from '../types';

interface LeadSearchProps {
  onLeadsFound: (leads: Lead[]) => void;
}

interface SourceOption {
  id: LeadSourceType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SOURCES: SourceOption[] = [
  { id: 'google', label: 'Google Search', icon: <Globe size={16} />, color: 'blue' },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={16} />, color: 'sky' },
  { id: 'directories', label: 'Annuaires', icon: <BookOpen size={16} />, color: 'emerald' },
  { id: 'social', label: 'Réseaux Sociaux', icon: <Share2 size={16} />, color: 'pink' },
];

export const LeadSearch: React.FC<LeadSearchProps> = ({ onLeadsFound }) => {
  const [query, setQuery] = useState('');
  const [offering, setOffering] = useState('');
  const [selectedSources, setSelectedSources] = useState<LeadSourceType[]>(['google']);
  const [isSearching, setIsSearching] = useState(false);

  const toggleSource = (sourceId: LeadSourceType) => {
    setSelectedSources(prev => 
      prev.includes(sourceId) 
        ? prev.filter(s => s !== sourceId) 
        : [...prev, sourceId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (selectedSources.length === 0) {
      alert("Veuillez sélectionner au moins une source de recherche.");
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchForLeads(query, selectedSources);
      
      const newLeads: Lead[] = results.map(r => ({
        id: crypto.randomUUID(),
        companyName: r.companyName || 'Unknown',
        contactName: r.contactName,
        email: r.email,
        website: r.website,
        location: r.location,
        description: r.description,
        source: r.source || selectedSources.join(", "),
        status: LeadStatus.NEW,
        selectedVariant: 'A',
        offeringDetails: offering,
        createdAt: Date.now(),
      }));

      onLeadsFound(newLeads);
    } catch (error) {
      alert("Erreur lors de la recherche. Veuillez réessayer.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 transition-all hover:shadow-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" />
            Sourcing Multi-Sources
          </h2>
          <p className="text-slate-500 text-sm">Ciblez précisément vos prospects sur le web et les réseaux.</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        
        {/* Source Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest">
            1. Sources de recherche
          </label>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  selectedSources.includes(source.id)
                    ? `bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105`
                    : `bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50`
                }`}
              >
                {source.icon}
                {source.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search Input */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
              2. Cible (Mots-clés / Secteur)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ex: 'Avocats d'affaires à Lyon'"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all"
              />
            </div>
          </div>

          {/* Offering Input */}
          <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-1">
                 <Briefcase size={12} />
                 3. Votre Offre
              </label>
              <textarea
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                placeholder="Décrivez ce que vous proposez pour personnaliser les emails..."
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none transition-all text-sm min-h-[46px] resize-none"
              />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-50 mt-4">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Recherche Temps-Réel Active
              </p>
            </div>

            <button 
                type="submit"
                disabled={isSearching}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-blue-200 active:scale-95"
            >
                {isSearching ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Extraction en cours...
                </>
                ) : (
                <>
                    <Sparkles className="w-5 h-5" />
                    Lancer l'automatisation
                </>
                )}
            </button>
        </div>
      </form>
    </div>
  );
};
