
import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Copy, Sparkles, MessageSquarePlus } from 'lucide-react';
import { Lead } from '../types';

interface EmailEditorProps {
  lead: Lead;
  onSave: (id: string, subject: string, body: string, selectedVariant: 'A' | 'B') => void;
  onClose: () => void;
  onRegenerate: (lead: Lead, instructions?: string) => void;
  isRegenerating: boolean;
}

export const EmailEditor: React.FC<EmailEditorProps> = ({ lead, onSave, onClose, onRegenerate, isRegenerating }) => {
  const [activeTab, setActiveTab] = useState<'A' | 'B'>(lead.selectedVariant || 'A');
  const [refinementText, setRefinementText] = useState('');
  
  // Local state for editing variants independently
  const [subjectA, setSubjectA] = useState(lead.variantA_Subject || '');
  const [bodyA, setBodyA] = useState(lead.variantA_Body || '');
  
  const [subjectB, setSubjectB] = useState(lead.variantB_Subject || '');
  const [bodyB, setBodyB] = useState(lead.variantB_Body || '');

  // Sync state when lead changes (e.g. after regeneration)
  useEffect(() => {
    setSubjectA(lead.variantA_Subject || '');
    setBodyA(lead.variantA_Body || '');
    setSubjectB(lead.variantB_Subject || '');
    setBodyB(lead.variantB_Body || '');
    setActiveTab(lead.selectedVariant || 'A');
    // We clear refinement text after a successful regeneration
    if (!isRegenerating) {
       // Optional: keep it or clear it. Let's clear it to show it was taken into account.
       // setRefinementText(''); 
    }
  }, [lead, isRegenerating]);

  const currentSubject = activeTab === 'A' ? subjectA : subjectB;
  const currentBody = activeTab === 'A' ? bodyA : bodyB;

  const handleSubjectChange = (val: string) => {
    if (activeTab === 'A') setSubjectA(val);
    else setSubjectB(val);
  };

  const handleBodyChange = (val: string) => {
    if (activeTab === 'A') setBodyA(val);
    else setBodyB(val);
  };

  const handleSave = () => {
    onSave(lead.id, currentSubject, currentBody, activeTab);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Révision de la Campagne (A/B Test)</h3>
            <p className="text-sm text-slate-500">Personnalisation pour <span className="font-semibold text-slate-900">{lead.companyName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Editing Area */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-100">
            {/* Tabs */}
            <div className="bg-white px-6 pt-4 border-b border-slate-100 flex items-center gap-2">
                <button 
                    onClick={() => setActiveTab('A')}
                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'A' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeTab === 'A' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>A</span>
                        Direct & Pro
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('B')}
                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'B' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                >
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-sm ${activeTab === 'B' ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'}`}>B</span>
                        Créatif
                    </div>
                </button>
            </div>

            {/* Content Inputs */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    Objet de l'email
                </label>
                <input 
                  type="text" 
                  value={currentSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none font-medium text-slate-800 transition-all"
                  placeholder="Objet de l'email..."
                />
              </div>
              
              <div className="flex-1 flex flex-col">
                 <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">
                    Corps du message
                 </label>
                 <textarea 
                    value={currentBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    className="w-full flex-1 min-h-[350px] p-5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none resize-none font-sans text-base leading-relaxed text-slate-700 transition-all"
                    placeholder="Bonjour [Nom]..."
                 />
              </div>
            </div>
          </div>

          {/* Sidebar / Refinement Controls */}
          <div className="w-80 bg-slate-50 p-6 flex flex-col gap-6">
            <div>
               <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={14} className="text-blue-500" />
                 Affinage par IA
               </h4>
               <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                 Ajoutez des précisions ou demandez un changement de ton pour les deux versions.
               </p>
               <textarea 
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="Ex: 'Mentionne que nous sommes basés à Paris' ou 'Sois plus amical'..."
                  className="w-full h-32 p-3 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none bg-white shadow-sm"
               />
               <button 
                  onClick={() => onRegenerate(lead, refinementText)}
                  disabled={isRegenerating}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white py-2.5 rounded-xl font-medium transition-all shadow-md active:scale-95"
               >
                  <RotateCcw size={16} className={isRegenerating ? "animate-spin" : ""} />
                  {isRegenerating ? "Réécriture..." : "Régénérer A/B"}
               </button>
            </div>

            <div className="mt-auto space-y-3">
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`Objet: ${currentSubject}\n\n${currentBody}`);
                   alert("Copié dans le presse-papier !");
                 }}
                 className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 bg-white border border-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-all"
               >
                 <Copy size={16} />
                 Copier l'email
               </button>
               <button 
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all transform active:scale-95"
               >
                 <Check size={20} />
                 Valider la Version {activeTab}
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
