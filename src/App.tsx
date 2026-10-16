import { useState, useEffect, useCallback } from 'react';
import { OpenWAGroup, OpenWAParticipant } from './types/openwa';
import { fetchGroups, fetchGroupDetails, getEnvConfig } from './services/openwa';
import { GroupList } from './components/GroupList';
import { ParticipantSelector } from './components/ParticipantSelector';
import { ExportModal } from './components/ExportModal';
import { ShieldCheck } from 'lucide-react';

export function App() {
  const [step, setStep] = useState<'groups' | 'contacts'>('groups');
  const [groups, setGroups] = useState<OpenWAGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  const [selectedGroup, setSelectedGroup] = useState<OpenWAGroup | null>(null);
  const [participants, setParticipants] = useState<OpenWAParticipant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState<OpenWAParticipant[]>([]);

  const envConfig = getEnvConfig();

  const loadGroups = useCallback(async () => {
    setLoadingGroups(true);
    setGroupsError(null);
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error loading groups';
      setGroupsError(message);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSelectGroup = async (group: OpenWAGroup) => {
    setSelectedGroup(group);
    setStep('contacts');
    setLoadingParticipants(true);
    setParticipantsError(null);
    try {
      const detail = await fetchGroupDetails(group.id);
      setParticipants(detail.participants || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch group participants';
      setParticipantsError(message);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleBackToGroups = () => {
    setStep('groups');
    setSelectedGroup(null);
    setParticipants([]);
    setParticipantsError(null);
  };

  const handleProceedToExport = (selected: OpenWAParticipant[]) => {
    setSelectedParticipants(selected);
    setIsExportModalOpen(true);
  };

  const handleExportComplete = () => {
    setIsExportModalOpen(false);
    // Reset back to page 1 as requested: "then we go back to page 1 get it."
    setStep('groups');
    setSelectedGroup(null);
    setParticipants([]);
    setSelectedParticipants([]);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-12 font-sans">
      {/* Top Spreadsheet Menubar / Ribbon */}
      <header className="bg-slate-900 text-white border-b border-slate-700 sticky top-0 z-40 select-none">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
              WA
            </div>
            <div>
              <h1 className="font-bold text-sm leading-none tracking-tight">
                OpenWA Group Extractor
              </h1>
              <span className="text-[10px] text-slate-400">WhatsApp contacts to .vcf</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-mono">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Read-Only
            </span>
            <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
              Session: {envConfig.sessionId ? `${envConfig.sessionId.slice(0, 8)}...` : 'None'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 pt-6">
        {step === 'groups' && (
          <GroupList
            groups={groups}
            loading={loadingGroups}
            error={groupsError}
            onSelectGroup={handleSelectGroup}
            onRefresh={loadGroups}
          />
        )}

        {step === 'contacts' && selectedGroup && (
          <ParticipantSelector
            group={selectedGroup}
            participants={participants}
            loading={loadingParticipants}
            error={participantsError}
            onBack={handleBackToGroups}
            onProceed={handleProceedToExport}
          />
        )}
      </main>

      {/* Export Modal */}
      {selectedGroup && (
        <ExportModal
          isOpen={isExportModalOpen}
          selectedParticipants={selectedParticipants}
          groupName={selectedGroup.name}
          onCancel={() => setIsExportModalOpen(false)}
          onExportComplete={handleExportComplete}
        />
      )}
    </div>
  );
}

export default App;
