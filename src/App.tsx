import { useState, useEffect, useCallback } from 'react';
import { OpenWAGroup, OpenWAParticipant } from './types/openwa';
import { fetchGroups, fetchGroupDetails } from './services/openwa';
import { GroupList } from './components/GroupList';
import { ParticipantSelector } from './components/ParticipantSelector';
import { ExportModal } from './components/ExportModal';

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
    <div className="min-h-screen bg-[#fbf1c7] text-[#3c3836] pb-16 font-sans">
      {/* Main Content Area - directly showing groups */}
      <main className="max-w-5xl mx-auto px-4 py-8">
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
