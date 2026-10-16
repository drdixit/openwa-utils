import { useState, useEffect, useRef } from 'react';
import { OpenWAConfig, DEFAULT_OPENWA_CONFIG } from '../services/openwa';

interface ConfigBarProps {
  config: OpenWAConfig;
  onSave: (newConfig: OpenWAConfig) => void;
  isLoading?: boolean;
}

export function ConfigBar({ config, onSave, isLoading = false }: ConfigBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [apiUrl, setApiUrl] = useState(config.apiUrl);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [sessionId, setSessionId] = useState(config.sessionId);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Sync state if external config changes while not actively editing
  useEffect(() => {
    if (!isEditing) {
      setApiUrl(config.apiUrl);
      setApiKey(config.apiKey);
      setSessionId(config.sessionId);
    }
  }, [config, isEditing]);

  // Automatically focus first field when entering edit mode
  useEffect(() => {
    if (isEditing) {
      firstInputRef.current?.focus();
    }
  }, [isEditing]);

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setApiUrl(config.apiUrl);
    setApiKey(config.apiKey);
    setSessionId(config.sessionId);
    setIsEditing(true);
  };

  const handleCancelClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setApiUrl(config.apiUrl);
    setApiKey(config.apiKey);
    setSessionId(config.sessionId);
    setIsEditing(false);
  };

  const handleSaveClick = (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    onSave({
      apiUrl: apiUrl.trim(),
      apiKey: apiKey.trim(),
      sessionId: sessionId.trim(),
    });
    setIsEditing(false);
  };

  const handleResetDefaults = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setApiUrl(DEFAULT_OPENWA_CONFIG.apiUrl);
    setApiKey(DEFAULT_OPENWA_CONFIG.apiKey);
    setSessionId(DEFAULT_OPENWA_CONFIG.sessionId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveClick(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelClick();
    }
  };

  return (
    <header className="bg-[#ebdbb2] border-b border-[#d5c4a1] shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
        {/* Container (no <form> tag to prevent browser navigation/refresh) */}
        <div role="region" aria-label="WhatsApp Gateway Configuration" className="w-full">
          <div className="flex flex-col lg:flex-row lg:items-end gap-2.5 sm:gap-3">
            {/* 3 Config Input Boxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 flex-1">
              {/* Server URL */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="config-openwa-url"
                  className="text-[11px] font-semibold tracking-wide text-[#504945] uppercase flex items-center justify-between"
                >
                  <span>Server URL</span>
                  <span className="text-[10px] font-mono text-[#7c6f64] font-normal">OPENWA_URL</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="config-openwa-url"
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isEditing}
                  placeholder="http://localhost:2785"
                  className={`w-full px-2.5 py-1.5 rounded-sm border font-mono text-base sm:text-xs transition-colors caret-[#d65d0e] ${
                    isEditing
                      ? 'bg-[#fbf1c7] border-[#458588] text-[#282828] focus:outline-none focus:ring-1 focus:ring-[#458588]'
                      : 'bg-[#f2e5bc] border-[#d5c4a1] text-[#3c3836] cursor-not-allowed opacity-90'
                  }`}
                />
              </div>

              {/* API Key */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="config-openwa-api-key"
                  className="text-[11px] font-semibold tracking-wide text-[#504945] uppercase flex items-center justify-between"
                >
                  <span>API Key</span>
                  <span className="text-[10px] font-mono text-[#7c6f64] font-normal">OPENWA_API_KEY</span>
                </label>
                <input
                  id="config-openwa-api-key"
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isEditing}
                  placeholder="owa_k1_..."
                  className={`w-full px-2.5 py-1.5 rounded-sm border font-mono text-base sm:text-xs transition-colors caret-[#d65d0e] ${
                    isEditing
                      ? 'bg-[#fbf1c7] border-[#458588] text-[#282828] focus:outline-none focus:ring-1 focus:ring-[#458588]'
                      : 'bg-[#f2e5bc] border-[#d5c4a1] text-[#3c3836] cursor-not-allowed opacity-90'
                  }`}
                />
              </div>

              {/* Session ID */}
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="config-openwa-session-id"
                  className="text-[11px] font-semibold tracking-wide text-[#504945] uppercase flex items-center justify-between"
                >
                  <span>Session ID</span>
                  <span className="text-[10px] font-mono text-[#7c6f64] font-normal">OPENWA_SESSION_ID</span>
                </label>
                <input
                  id="config-openwa-session-id"
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!isEditing}
                  placeholder="Session UUID"
                  className={`w-full px-2.5 py-1.5 rounded-sm border font-mono text-base sm:text-xs transition-colors caret-[#d65d0e] ${
                    isEditing
                      ? 'bg-[#fbf1c7] border-[#458588] text-[#282828] focus:outline-none focus:ring-1 focus:ring-[#458588]'
                      : 'bg-[#f2e5bc] border-[#d5c4a1] text-[#3c3836] cursor-not-allowed opacity-90'
                  }`}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-1 lg:pt-0 self-end lg:self-end">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditClick}
                  disabled={isLoading}
                  className="min-h-[36px] sm:min-h-[32px] px-3.5 py-1.5 text-xs font-semibold rounded-sm border border-[#458588] text-[#458588] hover:bg-[#458588] hover:text-[#fbf1c7] active:scale-98 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                  <span>Edit</span>
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSaveClick}
                    className="min-h-[36px] sm:min-h-[32px] px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-[#98971a] text-[#fbf1c7] hover:bg-[#79740e] active:scale-98 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="min-h-[36px] sm:min-h-[32px] px-3 py-1.5 text-xs font-medium rounded-sm border border-[#bdae93] text-[#504945] hover:bg-[#d5c4a1] active:scale-98 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    title="Reset to default prefilled credentials"
                    className="min-h-[36px] sm:min-h-[32px] px-2 py-1.5 text-[11px] font-medium text-[#7c6f64] hover:text-[#3c3836] underline cursor-pointer"
                  >
                    Defaults
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default ConfigBar;
