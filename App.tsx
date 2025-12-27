
import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { LeadSearch } from './components/LeadSearch';
import { StatCard } from './components/StatCard';
import { EmailEditor } from './components/EmailEditor';
import { generateLeadEmail } from './services/geminiService';
import { Lead, LeadStatus, ViewType } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';
import { 
  Users, 
  CheckCircle2, 
  Pencil, 
  Send as SendIcon, 
  Trash2,
  Wand2,
  Download,
  BarChart,
  Target,
  Calendar,
  Zap,
  CheckSquare,
  Sparkles,
  ShieldCheck,
  MousePointerClick,
  Menu,
  TrendingUp,
  Info
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [activeAction, setActiveAction] = useState<'GENERATING' | 'VALIDATING' | 'SENDING' | null>(null);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([]);

  const stats = useMemo(() => ({
    total: leads.length,
    new: leads.filter(l => l.status === LeadStatus.NEW).length,
    review: leads.filter(l => l.status === LeadStatus.REVIEW).length,
    ready: leads.filter(l => l.status === LeadStatus.READY).length,
    sent: leads.filter(l => l.status === LeadStatus.SENT).length,
  }), [leads]);

  const handleLeadsFound = (newLeads: Lead[]) => {
    // Sort new leads by qualification score descending
    const sortedLeads = [...newLeads].sort((a, b) => (b.qualificationScore || 0) - (a.qualificationScore || 0));
    setLeads(prev => [...sortedLeads, ...prev]);
  };

  const handleDelete = (id: string) => {
    setLeads(prev => prev.filter(l => l.id !== id));
  };

  const handleGenerateEmail = async (leadId: string) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.DRAFTING } : l));
    try {
      const { variantA, variantB } = await generateLeadEmail(lead);
      setLeads(prev => prev.map(l => l.id === leadId ? { 
        ...l, 
        status: LeadStatus.REVIEW,
        variantA_Subject: variantA.subject,
        variantA_Body: variantA.body,
        variantB_Subject: variantB.subject,
        variantB_Body: variantB.body,
        finalSubject: variantA.subject,
        finalBody: variantA.body,
        selectedVariant: 'A'
      } : l));
      return true;
    } catch (error) {
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.NEW } : l));
      return false;
    }
  };

  const handleGenerateAll = async () => {
    const targetLeads = leads.filter(l => l.status === LeadStatus.NEW);
    if (targetLeads.length === 0) return;
    setActiveAction('GENERATING');
    setBulkProgress(0);
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      setDispatchLogs(prev => [...prev.slice(-2), `Rédaction IA pour ${lead.companyName}...`]);
      await handleGenerateEmail(lead.id);
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }
    setTimeout(() => setActiveAction(null), 2000);
  };

  const handleApproveAll = async () => {
    const targetLeads = leads.filter(l => l.status === LeadStatus.REVIEW);
    if (targetLeads.length === 0) return;
    setActiveAction('VALIDATING');
    setBulkProgress(0);
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      await new Promise(r => setTimeout(r, 100));
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.READY } : l));
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }
    setTimeout(() => setActiveAction(null), 2000);
  };

  const handleSendAll = async () => {
    const targetLeads = leads.filter(l => l.status === LeadStatus.READY);
    if (targetLeads.length === 0) return;
    setActiveAction('SENDING');
    setBulkProgress(0);
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      await new Promise(r => setTimeout(r, 600)); 
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.SENT } : l));
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }
    setTimeout(() => setActiveAction(null), 2000);
  };

  const renderProgressBar = () => {
    if (!activeAction) return null;
    const config = {
      GENERATING: { label: "Rédaction IA", color: "from-blue-600 to-indigo-700", icon: Sparkles },
      VALIDATING: { label: "Validation", color: "from-purple-600 to-fuchsia-700", icon: ShieldCheck },
      SENDING: { label: "Expédition", color: "from-emerald-600 to-teal-700", icon: Zap },
    }[activeAction];

    const Icon = config.icon;

    return (
      <div className="mb-8 p-8 rounded-[2rem] border border-slate-200 bg-white shadow-2xl animate-in slide-in-from-top duration-500 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
             <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.color} text-white shadow-lg`}>
               <Icon size={24} />
             </div>
             <div>
                <h4 className="text-slate-900 font-black text-lg">{config.label}</h4>
                <p className="text-slate-400 text-xs font-medium">Traitement des prospects en cours...</p>
             </div>
          </div>
          <span className="text-3xl font-black text-slate-900">{bulkProgress}%</span>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden mb-6 p-1">
          <div className={`h-full bg-gradient-to-r ${config.color} transition-all duration-700 rounded-full`} style={{ width: `${bulkProgress}%` }} />
        </div>
        <div className="space-y-2">
          {dispatchLogs.map((log, i) => (
            <div key={i} className="text-[10px] font-bold text-slate-400 flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-slate-300"></div> {log}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <StatCard title="Prospects Qualifiés" value={stats.total} icon={<Users size={20} />} trend="+12%" />
        <StatCard title="Conversion Potentielle" value={`${stats.ready} leads`} icon={<TrendingUp size={20} />} color="bg-blue-50/50" />
        <StatCard title="Campagnes Actives" value={stats.sent} icon={<Zap size={20} />} />
      </div>

      {renderProgressBar()}

      {!activeAction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div onClick={handleGenerateAll} className={`group cursor-pointer p-8 rounded-[2rem] border-2 transition-all ${stats.new > 0 ? 'bg-white border-blue-50 hover:border-blue-200 hover:shadow-xl' : 'opacity-40 pointer-events-none'}`}>
             <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
               <Sparkles size={24} />
             </div>
             <h3 className="text-lg font-black text-slate-900 mb-2">1. Rédiger ({stats.new})</h3>
             <p className="text-sm text-slate-500">L'IA prépare des emails ultra-personnalisés basés sur la qualification.</p>
          </div>
          <div onClick={handleApproveAll} className={`group cursor-pointer p-8 rounded-[2rem] border-2 transition-all ${stats.review > 0 ? 'bg-white border-purple-50 hover:border-purple-200 hover:shadow-xl' : 'opacity-40 pointer-events-none'}`}>
             <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
               <CheckSquare size={24} />
             </div>
             <h3 className="text-lg font-black text-slate-900 mb-2">2. Valider ({stats.review})</h3>
             <p className="text-sm text-slate-500">Passez en revue les brouillons avant l'expédition massive.</p>
          </div>
          <div onClick={handleSendAll} className={`group cursor-pointer p-8 rounded-[2rem] border-2 transition-all ${stats.ready > 0 ? 'bg-slate-900 border-slate-800 hover:shadow-xl' : 'opacity-40 pointer-events-none'}`}>
             <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
               <Zap size={24} />
             </div>
             <h3 className="text-lg font-black text-white mb-2">3. Envoyer ({stats.ready})</h3>
             <p className="text-sm text-slate-400">Lancez l'expédition vers les serveurs SMTP configurés.</p>
          </div>
        </div>
      )}

      <LeadSearch onLeadsFound={handleLeadsFound} />
      {renderLeadTable(leads.slice(0, 10), "Top Prospects Qualifiés")}
    </>
  );

  const renderLeadTable = (leadsList: Lead[], title: string) => (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
           <h2 className="font-black text-slate-900 text-xl tracking-tight">{title}</h2>
           <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Classés par pertinence IA</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold">
           {leadsList.length} Leads
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-8 py-5">Société & Qualification</th>
              <th className="px-8 py-5">Maturité</th>
              <th className="px-8 py-5">Statut</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leadsList.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium">L'algorithme de sourcing est prêt. Lancez une recherche.</td></tr>
            ) : (
              leadsList.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/30 group transition-all duration-200">
                  <td className="px-8 py-6">
                    <div className="flex items-start gap-4">
                       <div className={`mt-1 flex items-center justify-center w-10 h-10 rounded-xl font-black text-[10px] shadow-sm ${
                         (lead.qualificationScore || 0) > 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                       }`}>
                         {lead.qualificationScore}%
                       </div>
                       <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-sm">{lead.companyName}</span>
                          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                             <Info size={10} className="text-blue-500" />
                             {lead.qualificationReason || "Analyse en cours..."}
                          </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            (lead.qualificationScore || 0) > 80 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`} 
                          style={{ width: `${lead.qualificationScore}%` }}
                        />
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border-2 ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lead.status === LeadStatus.NEW && (
                        <button onClick={() => handleGenerateEmail(lead.id)} className="p-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 transition-all"><Wand2 size={16}/></button>
                      )}
                      {(lead.status === LeadStatus.REVIEW || lead.status === LeadStatus.READY) && (
                        <button onClick={() => setEditingLeadId(lead.id)} className="p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-all"><Pencil size={16}/></button>
                      )}
                      <button onClick={() => handleDelete(lead.id)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Sidebar 
        currentView={view} 
        onViewChange={setView} 
        leadCount={leads.length} 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 w-full md:ml-0 p-4 md:p-8 lg:p-12 max-w-7xl mx-auto overflow-x-hidden">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="flex items-center gap-6 w-full">
             <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-xl"
             >
                <Menu size={24} />
             </button>
             <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-300 rotate-3 hover:rotate-0 transition-transform cursor-pointer">
               {view === 'dashboard' ? <BarChart size={32} /> : view === 'pipeline' ? <Target size={32} /> : view === 'sources' ? <MousePointerClick size={32} /> : <Calendar size={32} />}
             </div>
             <div>
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter capitalize mb-1">
                  {view}
                </h1>
                <p className="text-slate-400 text-xs font-bold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Sourcing Intelligence Active
                </p>
             </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
             <button onClick={() => {
                if (leads.length === 0) return;
                const headers = ["Société", "Score", "Email", "Statut"];
                const rows = leads.map(l => [l.companyName, l.qualificationScore, l.email || "", l.status]);
                const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `prospects_export.csv`;
                link.click();
             }} disabled={leads.length === 0} className="flex items-center gap-3 px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
               <Download size={18} /> Export Leads
             </button>
          </div>
        </header>

        {view === 'dashboard' && renderDashboard()}
        
        {(view === 'pipeline' || view === 'campaigns') && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-wrap gap-3 mb-8 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm w-full md:w-fit">
              <button onClick={() => setLeads([...leads])} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg">Tous les prospects</button>
              {Object.values(LeadStatus).map(s => (
                <button key={s} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors">{STATUS_LABELS[s]}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-12">
               {renderLeadTable(view === 'pipeline' ? leads : leads.filter(l => l.status === LeadStatus.SENT), view === 'pipeline' ? "Management du Pipeline" : "Campagnes Envoyées")}
            </div>
          </div>
        )}

        {view === 'sources' && (
          <div className="bg-white p-20 rounded-[3rem] border-2 border-slate-50 text-center shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="w-32 h-32 bg-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-blue-100 rotate-12">
                <Target className="text-white w-16 h-16" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tighter">Moteur de Data-Mining</h2>
             <p className="text-slate-500 max-w-2xl mx-auto mb-12 text-lg font-medium leading-relaxed">
               Nous utilisons des agents autonomes pour scanner LinkedIn, Google Maps et les registres d'entreprises afin de construire votre base de données idéale.
             </p>
             <div className="flex justify-center gap-4 flex-wrap">
               {['LinkedIn', 'Kompass', 'Google Maps', 'Apollo.io API', 'Grounding Sémantique'].map(s => (
                 <span key={s} className="px-8 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:scale-105 transition-transform">
                   {s}
                 </span>
               ))}
             </div>
          </div>
        )}
      </main>

      {editingLeadId && (
        <EmailEditor 
          lead={leads.find(l => l.id === editingLeadId)!}
          onSave={(id, sub, body, variant) => {
            setLeads(prev => prev.map(l => l.id === id ? { ...l, status: LeadStatus.READY, finalSubject: sub, finalBody: body, selectedVariant: variant } : l));
            setEditingLeadId(null);
          }}
          onClose={() => setEditingLeadId(null)}
          onRegenerate={async (lead, inst) => {
            setIsGeneratingEmail(true);
            try {
              const { variantA, variantB } = await generateLeadEmail(lead, inst);
              setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, variantA_Subject: variantA.subject, variantA_Body: variantA.body, variantB_Subject: variantB.subject, variantB_Body: variantB.body } : l));
            } finally { setIsGeneratingEmail(false); }
          }}
          isRegenerating={isGeneratingEmail}
        />
      )}
    </div>
  );
};

export default App;
