
import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Globe, Briefcase, Linkedin, BookOpen, Share2, Database, AlertCircle } from 'lucide-react';
import { searchForLeads } from '../services/geminiService';
import { Lead, LeadStatus, LeadSourceType } from '../types';

interface LeadSearchProps {
  onLeadsFound: (leads: Lead[]) => void;
}

interface SourceOption {
  id: LeadSourceType;
  label: string;
  icon: React.ReactNode;
}

const SOURCES: SourceOption[] = [
  { id: 'google', label: 'Google', icon: <Globe size={14} /> },
  { id: 'linkedin', label: 'LinkedIn', icon: <Linkedin size={14} /> },
  { id: 'directories', label: 'Annuaires', icon: <BookOpen size={14} /> },
  { id: 'social', label: 'Social', icon: <Share2 size={14} /> },
];

export const LeadSearch: React.FC<LeadSearchProps> = ({ onLeadsFound }) => {
  const [query, setQuery] = useState('');
  const [offering, setOffering] = useState('');
  const [selectedSources, setSelectedSources] = useState<LeadSourceType[]>(['google', 'linkedin']);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStep, setSearchStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setIsSearching(true);
    setErrorMsg(null);
    setSearchStep('Initialisation du moteur...');
    
    try {
      setSearchStep('Exploration du web profond...');
      const results = await searchForLeads(query, selectedSources, offering);
      
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
        qualificationScore: r.qualificationScore,
        qualificationReason: r.qualificationReason,
        selectedVariant: 'A',
        offeringDetails: offering,
        createdAt: Date.now(),
      }));
      onLeadsFound(newLeads);
      setQuery('');
    } catch (error: any) {
      console.error(error);
      setErrorMsg(error.message || "Une erreur inattendue est survenue.");
    } finally {
      setIsSearching(false);
      setSearchStep('');
    }
  };

  return (
    <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-200 shadow-xl mb-8 relative overflow-hidden">
      {isSearching && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-16 h-16 relative mb-4">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto text-blue-600 w-6 h-6 animate-pulse" />
           </div>
           <p className="text-slate-900 font-bold text-sm tracking-tight">{searchStep}</p>
           <p className="text-slate-400 text-[10px] mt-2 font-mono">Gemini-3-Flash Engine Active</p>
        </div>
      )}

      <div className="mb-8">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200">
              <Database className="w-5 h-5" />
            </div>
            Sourcing Intelligent
          </h2>
          <p className="text-slate-500 text-xs mt-1">Générez une liste de prospects qualifiés par IA en quelques secondes.</p>
      </div>

      <form onSubmit={handleSearch} className="space-y-8">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 mb-4 uppercase tracking-widest">
            1. Canaux de recherche
          </label>
          <div className="flex flex-wrap gap-3">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                type="button"
                onClick={() => toggleSource(source.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border-2 font-bold transition-all ${
                  selectedSources.includes(source.id)
                    ? `bg-slate-900 border-slate-900 text-white shadow-xl scale-105`
                    : `bg-white border-slate-100 text-slate-400 hover:border-slate-300`
                }`}
              >
                {source.icon}
                <span className="text-xs">{source.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="relative">
            <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">
              2. Quel type d'entreprises ?
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ex: 'Agences Marketing à Lyon' ou 'E-commerce Shopify'"
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all font-medium"
              />
            </div>
          </div>

          <div>
              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                 <Briefcase size={12} />
                 3. Que vendez-vous ? (Pour la qualification)
              </label>
              <input
                type="text"
                value={offering}
                onChange={(e) => setOffering(e.target.value)}
                placeholder="Ex: Un logiciel de CRM pour PME"
                className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-50 outline-none text-sm transition-all font-medium"
              />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="text-red-500 shrink-0" size={20} />
            <p className="text-red-700 text-xs font-semibold leading-relaxed">{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center justify-between pt-6 border-t border-slate-50 gap-6">
            <div className="flex items-center gap-4">
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>)}
               </div>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Analysé par Gemini Search & Maps
               </p>
            </div>

            <button 
                type="submit"
                disabled={isSearching || !query || !offering}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:bg-slate-100 disabled:text-slate-400 shadow-2xl shadow-blue-200 active:scale-95"
            >
                <Sparkles className="w-5 h-5" />
                Démarrer le Sourcing IA
            </button>
        </div>
      </form>
    </div>
  );
};
