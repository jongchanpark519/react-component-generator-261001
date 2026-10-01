import { useState, useEffect, useRef } from 'react';
import { PromptInput } from './components/PromptInput';
import { ComponentCard } from './components/ComponentCard';
import { useComponentGenerator } from './hooks/useComponentGenerator';
import type { Provider } from './types';
import './App.css';

const PROVIDER_CONFIG = {
  anthropic: { label: 'Anthropic', placeholder: 'sk-ant-...' },
  google: { label: 'Google', placeholder: 'AIza...' },
} as const;

function App() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [provider, setProvider] = useState<Provider>('google');
  const [envKeys, setEnvKeys] = useState<Record<Provider, boolean>>({
    anthropic: false,
    google: false,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyMissing, setKeyMissing] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);
  const { components, isLoading, error, generate, removeComponent, clearAll } =
    useComponentGenerator();

  useEffect(() => {
    fetch('/api/config')
      .then((res) => res.json())
      .then((data) => setEnvKeys(data.envKeys))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handlePointer = (e: PointerEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setSettingsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSettingsOpen(false);
    };
    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [settingsOpen]);

  const hasEnvKey = envKeys[provider];
  const hasKey = Boolean(apiKey.trim()) || hasEnvKey;
  const activeProvider = PROVIDER_CONFIG[provider].label;

  const handleGenerate = (prompt: string) => {
    if (!hasKey) {
      setKeyMissing(true);
      setSettingsOpen(true);
      requestAnimationFrame(() => keyInputRef.current?.focus());
      return;
    }
    generate(prompt, apiKey || undefined, provider);
  };

  const handleProviderChange = (newProvider: Provider) => {
    setProvider(newProvider);
    setApiKey('');
  };

  const handleKeyChange = (value: string) => {
    setApiKey(value);
    if (value.trim()) setKeyMissing(false);
  };

  return (
    <div className="desktop">
      <header className="menubar">
        <span className="menubar-app">React 컴포넌트 생성기</span>

        <div className="menubar-settings" ref={settingsRef}>
          <button
            type="button"
            className={`menubar-item ${settingsOpen ? 'menubar-item--open' : ''}`}
            aria-expanded={settingsOpen}
            aria-controls="settings-menu"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            설정
          </button>

          {settingsOpen && (
            <div className="settings-menu" id="settings-menu" role="dialog" aria-label="실행 설정">
              <div className="field">
                <label htmlFor="provider">모델 제공자</label>
                <select
                  id="provider"
                  className="select"
                  value={provider}
                  onChange={(e) => handleProviderChange(e.target.value as Provider)}
                >
                  {Object.entries(PROVIDER_CONFIG).map(([key, { label }]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="api-key">API 키</label>
                <div className="api-key-field">
                  <input
                    id="api-key"
                    ref={keyInputRef}
                    className="text-input"
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    placeholder={hasEnvKey ? '서버 키 사용 중' : PROVIDER_CONFIG[provider].placeholder}
                  />
                  <button className="btn" onClick={() => setShowKey(!showKey)} type="button">
                    {showKey ? '숨기기' : '보기'}
                  </button>
                </div>
                <p className={`field-note ${keyMissing && !hasKey ? 'field-note--alert' : ''}`}>
                  {hasEnvKey
                    ? '.env 키를 사용합니다. 직접 입력하면 이 키를 대신 씁니다.'
                    : keyMissing
                      ? `${activeProvider} API 키를 입력해야 생성할 수 있습니다.`
                      : '키를 입력하거나 서버 .env에 설정하세요.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="menubar-status">
          <span>{activeProvider}</span>
          <span className={`key-light ${hasKey ? 'key-light--on' : ''}`}>
            {hasKey ? '키 연결됨' : '키 없음'}
          </span>
        </div>
      </header>

      <main className="workspace">
        <section className="window window--prompt" aria-labelledby="prompt-title">
          <div className="titlebar">
            <h1 className="titlebar-title" id="prompt-title">새 컴포넌트</h1>
          </div>
          <PromptInput onGenerate={handleGenerate} isLoading={isLoading} />
        </section>

        {error && (
          <div className="alert" role="alert">
            <span className="alert-icon" aria-hidden="true">!</span>
            <div>
              <p className="alert-title">컴포넌트를 생성하지 못했습니다.</p>
              <p className="alert-body">{error}</p>
            </div>
          </div>
        )}

        <section className="results" aria-label="만든 컴포넌트">
          {components.length > 0 && (
            <div className="results-bar">
              <h2>만든 컴포넌트 {components.length}개</h2>
              <button className="btn" onClick={clearAll} type="button">
                모두 지우기
              </button>
            </div>
          )}

          {isLoading && (
            <div className="window window--progress" role="status">
              <div className="titlebar">
                <span className="titlebar-title">생성 중</span>
              </div>
              <div className="progress-body">
                <p>{activeProvider} 모델이 컴포넌트를 만들고 있습니다.</p>
                <div className="progress-bar" aria-hidden="true" />
              </div>
            </div>
          )}

          {components.length === 0 && !isLoading && (
            <div className="empty-outline">
              <p className="empty-title">아직 만든 컴포넌트가 없습니다</p>
              <p>위 창에 원하는 UI를 적거나 예시를 고른 뒤 컴포넌트 생성을 누르세요.</p>
            </div>
          )}

          <div className="results-grid">
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                onRemove={removeComponent}
                onRegenerate={handleGenerate}
                isLoading={isLoading}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
