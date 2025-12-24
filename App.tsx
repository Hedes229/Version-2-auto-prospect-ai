
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
  ExternalLink,
  Trash2,
  Wand2,
  Download,
  Play,
  Loader2,
  MapPin,
  BarChart,
  Target,
  Calendar,
  Zap,
  Check,
  CheckSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MousePointerClick
} from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('dashboard');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  // Massive Actions States
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
    setLeads(prev => [...newLeads, ...prev]);
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
    setDispatchLogs(["Démarrage de l'analyse sémantique...", "Connexion à Gemini-3-Pro..."]);
    
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      setDispatchLogs(prev => [...prev.slice(-3), `Rédaction IA pour ${lead.companyName}...`]);
      await handleGenerateEmail(lead.id);
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }
    
    setDispatchLogs(prev => [...prev, "✓ Tous les brouillons sont prêts pour révision."]);
    setTimeout(() => setActiveAction(null), 2000);
  };

  const handleApproveAll = async () => {
    const targetLeads = leads.filter(l => l.status === LeadStatus.REVIEW);
    if (targetLeads.length === 0) return;
    
    setActiveAction('VALIDATING');
    setBulkProgress(0);
    setDispatchLogs(["Vérification de la conformité RGPD...", "Validation des syntaxes d'email..."]);
    
    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      await new Promise(r => setTimeout(r, 100)); // Rapide pour l'effet visuel
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.READY } : l));
      setDispatchLogs(prev => [...prev.slice(-3), `Validation OK : ${lead.companyName}`]);
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }
    
    setDispatchLogs(prev => [...prev, "✓ Tous les emails sont validés."]);
    setTimeout(() => setActiveAction(null), 2000);
  };

  const simulateSendEmail = async (leadId: string) => {
    await new Promise(resolve => setTimeout(resolve, 600)); 
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: LeadStatus.SENT } : l));
    return true;
  };

  const handleSendAll = async () => {
    const targetLeads = leads.filter(l => l.status === LeadStatus.READY);
    if (targetLeads.length === 0) return;

    setActiveAction('SENDING');
    setBulkProgress(0);
    setDispatchLogs(["Ouverture des sockets SMTP...", "Chiffrement TLS activé."]);

    for (let i = 0; i < targetLeads.length; i++) {
      const lead = targetLeads[i];
      setDispatchLogs(prev => [...prev.slice(-3), `Transmission du paquet vers ${lead.email || lead.companyName}...`]);
      await simulateSendEmail(lead.id);
      setBulkProgress(Math.round(((i + 1) / targetLeads.length) * 100));
    }

    setDispatchLogs(prev => [...prev, "✓ Campagne expédiée avec succès."]);
    setTimeout(() => {
      setActiveAction(null);
      setDispatchLogs([]);
    }, 2000);
  };

  const exportToCSV = () => {
    if (leads.length === 0) return;
    const headers = ["ID", "Société", "Contact", "Email", "Site Web", "Source", "Statut"];
    const rows = leads.map(l => [l.id, l.companyName, l.contactName || "", l.email || "", l.website || "", l.source, l.status]);
    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `autoprospect_export_${Date.now()}.csv`;
    link.click();
  };

  const handleDelete = (id: string) => {
    if(confirm("Supprimer ce prospect ?")) setLeads(prev => prev.filter(l => l.id !== id));
  };

  const renderProgressBar = () => {
    if (!activeAction) return null;

    const config = {
      GENERATING: { label: "Intelligence Artificielle en Action", color: "from-blue-600 to-indigo-700", bg: "bg-blue-900/10", icon: <Sparkles className="animate-pulse" />, sub: "Rédaction des emails personnalisés" },
      VALIDATING: { label: "Validation de Conformité", color: "from-purple-600 to-fuchsia-700", bg: "bg-purple-900/10", icon: <ShieldCheck className="animate-bounce" />, sub: "Vérification des brouillons" },
      SENDING: { label: "Expédition des Séquences", color: "from-emerald-600 to-teal-700", bg: "bg-emerald-900/10", icon: <Zap className="animate-pulse" />, sub: "Envoi via passerelle sécurisée" },
    }[activeAction];

    return (
      <div className={`mb-8 p-8 rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 animate-in fade-in zoom-in duration-500 overflow-hidden relative group`}>
        <div className="absolute -right-10 -top-10 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
           {/* Cast to any to allow size prop on the cloned icon element */}
           {React.cloneElement(config.icon as React.ReactElement<any>, { size: 240 })}
        </div>
        
        <div className="flex justify-between items-end mb-6 relative z-10">
          <div className="flex items-center gap-5">
             <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-lg`}>
               {/* Cast to any to allow size prop on the cloned icon element */}
               {React.cloneElement(config.icon as React.ReactElement<any>, { size: 28 })}
             </div>
             <div>
                <h4 className="text-slate-900 font-black text-xl tracking-tight">{config.label}</h4>
                <p className="text-slate-500 text-sm font-medium">{config.sub}</p>
             </div>
          </div>
          <div className="text-right">
             <span className="text-4xl font-black text-slate-900 font-mono tracking-tighter">{bulkProgress}%</span>
          </div>
        </div>
        
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 p-1 mb-6">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${config.color} transition-all duration-700 ease-out shadow-lg`}
            style={{ width: `${bulkProgress}%` }}
          />
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col gap-2">
          {dispatchLogs.map((log, i) => (
            <div key={i} className="text-[11px] font-mono text-slate-600 flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
              <span className="text-slate-300">[{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}]</span>
              <span className={log.includes('✓') ? 'text-green-600 font-bold' : ''}>{log}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard title="Total Prospects" value={stats.total} icon={<Users className="w-5 h-5" />} trend="+24%" />
        <StatCard title="Prêts à l'envoi" value={stats.ready} icon={<CheckCircle2 className="w-5 h-5" />} color="bg-emerald-50/50" />
        <StatCard title="Emails Envoyés" value={stats.sent} icon={<SendIcon className="w-5 h-5" />} />
      </div>

      {renderProgressBar()}

      {/* Control Center */}
      {!activeAction && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <button 
            onClick={handleGenerateAll}
            disabled={stats.new === 0}
            className={`p-8 rounded-[2rem] border transition-all flex flex-col gap-5 text-left group relative overflow-hidden ${
              stats.new > 0 ? 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5' : 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className={`p-4 rounded-2xl w-fit ${stats.new > 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-300 text-slate-500'}`}>
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${stats.new > 0 ? 'text-slate-900' : 'text-slate-400'}`}>1. Générer Brouillons ({stats.new})</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">L'IA rédige une approche unique pour chaque prospect.</p>
            </div>
            {stats.new > 0 && <ArrowRight size={20} className="text-blue-500 mt-4 self-end group-hover:translate-x-2 transition-transform" />}
          </button>

          <button 
            onClick={handleApproveAll}
            disabled={stats.review === 0}
            className={`p-8 rounded-[2rem] border transition-all flex flex-col gap-5 text-left group relative overflow-hidden ${
              stats.review > 0 ? 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/5' : 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className={`p-4 rounded-2xl w-fit ${stats.review > 0 ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-slate-300 text-slate-500'}`}>
              <CheckSquare size={24} />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${stats.review > 0 ? 'text-slate-900' : 'text-slate-400'}`}>2. Valider tout ({stats.review})</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">Validation groupée pour le passage en file d'attente.</p>
            </div>
            {stats.review > 0 && <ArrowRight size={20} className="text-purple-500 mt-4 self-end group-hover:translate-x-2 transition-transform" />}
          </button>

          <button 
            onClick={handleSendAll}
            disabled={stats.ready === 0}
            className={`p-8 rounded-[2rem] border transition-all flex flex-col gap-5 text-left group relative overflow-hidden ${
              stats.ready > 0 ? 'bg-slate-900 border-slate-800 hover:shadow-2xl hover:shadow-emerald-500/10' : 'bg-slate-50 border-slate-200 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className={`p-4 rounded-2xl w-fit ${stats.ready > 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-300 text-slate-500'}`}>
              <Zap size={24} />
            </div>
            <div>
              <h3 className={`text-lg font-black tracking-tight ${stats.ready > 0 ? 'text-white' : 'text-slate-400'}`}>3. Envoyer Campagne ({stats.ready})</h3>
              <p className="text-sm text-slate-400 mt-2 font-medium">Lancement immédiat de l'expédition multicanale.</p>
            </div>
            {stats.ready > 0 && <SendIcon size={20} className="text-emerald-400 mt-4 self-end group-hover:translate-x-2 transition-transform" />}
          </button>
        </div>
      )}

      <LeadSearch onLeadsFound={handleLeadsFound} />
      {renderLeadTable(leads.slice(0, 5), "Dernières Activités")}
    </>
  );

  const renderLeadTable = (leadsList: Lead[], title: string) => (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex-1 mb-8">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
        <div className="flex items-center gap-4">
          <h2 className="font-black text-slate-900 tracking-tight">{title}</h2>
          <span className="text-[11px] font-bold text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full">{leadsList.length} Units</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.25em]">
              <th className="px-10 py-5">Prospect</th>
              <th className="px-10 py-5">Status IA</th>
              <th className="px-10 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leadsList.length === 0 ? (
              <tr><td colSpan={3} className="px-10 py-24 text-center text-slate-400">
                <div className="flex flex-col items-center gap-5">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                    <Users size={32} className="opacity-10" />
                  </div>
                  <p className="font-medium">Aucun prospect disponible.</p>
                </div>
              </td></tr>
            ) : (
              leadsList.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/30 group transition-all duration-300">
                  <td className="px-10 py-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 text-sm">{lead.companyName}</span>
                      <div className="flex items-center gap-3 mt-1.5">
                         <span className="text-xs text-slate-500 font-medium">{lead.contactName || 'Responsable'}</span>
                         {lead.website && (
                           <a href={lead.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors p-1"><ExternalLink size={12} /></a>
                         )}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                      {lead.status === LeadStatus.NEW && (
                        <button onClick={() => handleGenerateEmail(lead.id)} className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm">
                          <Wand2 size={18}/>
                        </button>
                      )}
                      {lead.status === LeadStatus.REVIEW && (
                        <button 
                          onClick={() => setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: LeadStatus.READY } : l))}
                          className="p-2.5 text-purple-600 bg-purple-50 hover:bg-purple-600 hover:text-white rounded-2xl transition-all shadow-sm"
                        >
                          <Check size={18}/>
                        </button>
                      )}
                      {lead.status === LeadStatus.READY && (
                        <button onClick={() => simulateSendEmail(lead.id)} className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-600 hover:text-white rounded-2xl transition-all shadow-sm">
                          <SendIcon size={18}/>
                        </button>
                      )}
                      {(lead.status === LeadStatus.REVIEW || lead.status === LeadStatus.READY) && (
                        <button onClick={() => setEditingLeadId(lead.id)} className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-800 hover:text-white rounded-2xl transition-all shadow-sm"><Pencil size={18}/></button>
                      )}
                      <button onClick={() => handleDelete(lead.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={18}/></button>
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
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
      <Sidebar currentView={view} onViewChange={setView} leadCount={leads.length} />
      
      <main className="flex-1 md:ml-64 p-10 transition-all max-w-7xl mx-auto w-full">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-[1.5rem] bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-300">
               {view === 'dashboard' ? <BarChart size={28} /> : view === 'pipeline' ? <Target size={28} /> : view === 'sources' ? <MousePointerClick size={28} /> : <Calendar size={28} />}
             </div>
             <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight capitalize">
                  {view === 'dashboard' ? 'Overview' : view}
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-semibold flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                   AutoProspect v3.0 Core Engine
                </p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={exportToCSV} disabled={leads.length === 0} className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50">
               <Download size={16} /> Export Data
             </button>
             <div className="h-10 w-px bg-slate-200 mx-2 hidden md:block"></div>
             <div className="flex items-center gap-4 bg-white p-2 pr-6 rounded-[1.25rem] border border-slate-200 shadow-sm">
               <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">UD</div>
               <div className="text-xs font-black text-slate-800 hidden sm:block uppercase tracking-wider">User Demo</div>
             </div>
          </div>
        </header>

        {view === 'dashboard' && renderDashboard()}
        
        {(view === 'pipeline' || view === 'campaigns') && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {renderProgressBar()}
            <div className="flex flex-wrap gap-3 mb-6 bg-white p-2.5 rounded-[1.5rem] border border-slate-200 shadow-sm w-fit">
              <button onClick={() => setView(view)} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg">Tous ({leads.length})</button>
              {Object.values(LeadStatus).map(s => (
                <button key={s} className="px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">{STATUS_LABELS[s]}</button>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               {renderLeadTable(view === 'pipeline' ? leads : leads.filter(l => l.status === LeadStatus.SENT), view === 'pipeline' ? "Management Pipeline" : "Historique Séquences")}
               {view === 'campaigns' && renderLeadTable(leads.filter(l => l.status === LeadStatus.READY), "File d'attente sortante")}
            </div>
          </div>
        )}

        {view === 'sources' && (
          <div className="bg-white p-24 rounded-[3.5rem] border border-slate-200 text-center shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
             <div className="w-28 h-28 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                <Target className="text-blue-500 w-14 h-14" />
             </div>
             <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Data Intelligence Center</h2>
             <p className="text-slate-500 max-w-xl mx-auto mb-12 text-lg leading-relaxed font-medium">
               Analyse multicanale en temps-réel via les couches sémantiques de Gemini pour identifier les signaux d'affaires faibles et forts.
             </p>
             <div className="flex justify-center gap-5 flex-wrap">
               {['Google Search', 'LinkedIn Graph', 'Google Maps API', 'B2B Directories'].map(s => (
                 <span key={s} className="px-8 py-4 bg-slate-50 text-slate-900 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] border border-slate-200 flex items-center gap-4 shadow-sm transition-all hover:scale-105 hover:bg-white hover:border-blue-200">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div> {s}
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
