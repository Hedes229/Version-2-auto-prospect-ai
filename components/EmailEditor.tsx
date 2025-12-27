
import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, Copy, Sparkles } from 'lucide-react';
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
  
  const [subjectA, setSubjectA] = useState(lead.variantA_Subject || '');
  const [bodyA, setBodyA] = useState(lead.variantA_Body || '');
  const [subjectB, setSubjectB] = useState(lead.variantB_Subject || '');
  const [bodyB, setBodyB] = useState(lead.variantB_Body || '');

  useEffect(() => {
    setSubjectA(lead.variantA_Subject || '');
    setBodyA(lead.variantA_Body || '');
    setSubjectB(lead.variantB_Subject || '');
    setBodyB(lead.variantB_Body || '');
    setActiveTab(lead.selectedVariant || 'A');
  }, [lead]);

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4">
      <div className="bg-white rounded-none md:rounded-2xl shadow-2xl w-full max-w-5xl h-full md:max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-slate-800">Éditeur de Campagne</h3>
            <p className="text-xs md:text-sm text-slate-500">Prospect: <span className="font-semibold text-slate-900">{lead.companyName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
          
          {/* Main Editing Area */}
          <div className="flex-1 flex flex-col overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-100">
            {/* Tabs */}
            <div className="bg-white px-4 md:px-6 pt-2 border-b border-slate-100 flex items-center gap-1 overflow-x-auto">
                <button 
                    onClick={() => setActiveTab('A')}
                    className={`pb-3 px-4 text-xs md:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'A' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400'}`}
                >
                    <span className="mr-2 opacity-50">#A</span> Direct & Pro
                </button>
                <button 
                    onClick={() => setActiveTab('B')}
                    className={`pb-3 px-4 text-xs md:text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${activeTab === 'B' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-400'}`}
                >
                    <span className="mr-2 opacity-50">#B</span> Créatif
                </button>
            </div>

            {/* Content Inputs */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-4 md:space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Objet</label>
                <input 
                  type="text" 
                  value={currentSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none font-medium text-slate-800"
                />
              </div>
              
              <div className="flex-1 min-h-[250px] lg:min-h-0 flex flex-col">
                 <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Message</label>
                 <textarea 
                    value={currentBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    className="w-full flex-1 p-4 md:p-5 rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none text-sm md:text-base leading-relaxed text-slate-700"
                 />
              </div>
            </div>
          </div>

          {/* Sidebar / Refinement Controls */}
          <div className="w-full lg:w-80 bg-slate-50 p-4 md:p-6 flex flex-col gap-4 md:gap-6 overflow-y-auto lg:overflow-visible">
            <div>
               <h4 className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest flex items-center gap-2">
                 <Sparkles size={14} className="text-blue-500" />
                 Affinage IA
               </h4>
               <textarea 
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="Instructions spécifiques..."
                  className="w-full h-24 md:h-32 p-3 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none resize-none bg-white shadow-sm"
               />
               <button 
                  onClick={() => onRegenerate(lead, refinementText)}
                  disabled={isRegenerating}
                  className="w-full mt-3 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white py-2.5 rounded-xl font-medium transition-all"
               >
                  <RotateCcw size={16} className={isRegenerating ? "animate-spin" : ""} />
                  {isRegenerating ? "Calcul..." : "Régénérer"}
               </button>
            </div>

            <div className="mt-auto flex flex-col gap-2">
               <button 
                 onClick={() => {
                   navigator.clipboard.writeText(`Objet: ${currentSubject}\n\n${currentBody}`);
                   alert("Copié !");
                 }}
                 className="w-full flex items-center justify-center gap-2 text-slate-600 hover:bg-white border border-slate-200 py-2.5 rounded-xl text-sm font-semibold transition-all"
               >
                 <Copy size={16} /> Copier
               </button>
               <button 
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
               >
                 <Check size={20} /> Valider la Version {activeTab}
               </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
