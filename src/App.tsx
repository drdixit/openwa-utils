import { useState, useEffect, useCallback } from 'react';
import { OpenWAGroup, OpenWAParticipant } from './types/openwa';
import { fetchGroups, fetchGroupDetails, getEnvConfig } from './services/openwa';
import { GroupList } from './components/GroupList';
import { ParticipantSelector } from './components/ParticipantSelector';
import { ExportModal } from './components/ExportModal';
import { MessageSquareText, ShieldCheck } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-800 leading-tight">
                OpenWA Group Extractor
              </h1>
              <p className="text-xs text-slate-400">Extract WhatsApp contacts to .vcf file</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Read-Only
            </span>
            <div className="text-right text-[11px] text-slate-400 font-mono hidden md:block">
              Session: {envConfig.sessionId ? `${envConfig.sessionId.slice(0, 8)}...` : 'None'}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 pt-8">
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
