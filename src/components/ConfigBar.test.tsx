import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigBar } from './ConfigBar';
import { OpenWAConfig } from '../services/openwa';

const initialConfig: OpenWAConfig = {
  apiUrl: 'http://localhost:2785',
  apiKey: 'owa_k1_7a62176801cde43df4e13abff974f8a1efe1771e9777078ae22a92809d87202c',
  sessionId: 'a9a7f860-5961-48e3-908c-66880d8e6197',
};

describe('ConfigBar Component', () => {
  it('renders prefilled inputs with default values in locked mode', () => {
    const handleSave = vi.fn();
    render(<ConfigBar config={initialConfig} onSave={handleSave} />);

    const urlInput = screen.getByLabelText(/Server URL/i) as HTMLInputElement;
    const keyInput = screen.getByLabelText(/API Key/i) as HTMLInputElement;
    const sessionInput = screen.getByLabelText(/Session ID/i) as HTMLInputElement;

    expect(urlInput.value).toBe('http://localhost:2785');
    expect(keyInput.value).toBe('owa_k1_7a62176801cde43df4e13abff974f8a1efe1771e9777078ae22a92809d87202c');
    expect(sessionInput.value).toBe('a9a7f860-5961-48e3-908c-66880d8e6197');

    expect(urlInput).toBeDisabled();
    expect(keyInput).toBeDisabled();
    expect(sessionInput).toBeDisabled();
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  it('switches to edit mode and allows inputs to be edited', () => {
    const handleSave = vi.fn();
    render(<ConfigBar config={initialConfig} onSave={handleSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    const urlInput = screen.getByLabelText(/Server URL/i) as HTMLInputElement;
    expect(urlInput).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('calls onSave with updated credentials when Save is clicked', () => {
    const handleSave = vi.fn();
    render(<ConfigBar config={initialConfig} onSave={handleSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    const urlInput = screen.getByLabelText(/Server URL/i);
    const keyInput = screen.getByLabelText(/API Key/i);
    const sessionInput = screen.getByLabelText(/Session ID/i);

    fireEvent.change(urlInput, { target: { value: 'http://custom-host:8080' } });
    fireEvent.change(keyInput, { target: { value: 'custom_key_456' } });
    fireEvent.change(sessionInput, { target: { value: 'new-session-id' } });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(handleSave).toHaveBeenCalledWith({
      apiUrl: 'http://custom-host:8080',
      apiKey: 'custom_key_456',
      sessionId: 'new-session-id',
    });
    // Should switch back to locked mode
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
  });

  it('reverts modifications when Cancel is clicked in edit mode', () => {
    const handleSave = vi.fn();
    render(<ConfigBar config={initialConfig} onSave={handleSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    const sessionInput = screen.getByLabelText(/Session ID/i) as HTMLInputElement;
    fireEvent.change(sessionInput, { target: { value: 'changed-id' } });
    expect(sessionInput.value).toBe('changed-id');

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));

    expect(handleSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Edit/i })).toBeInTheDocument();
    expect(sessionInput.value).toBe(initialConfig.sessionId);
    expect(sessionInput).toBeDisabled();
  });

  it('does not render a form element to prevent accidental browser page refresh', () => {
    const handleSave = vi.fn();
    const { container } = render(<ConfigBar config={initialConfig} onSave={handleSave} />);
    expect(container.querySelector('form')).toBeNull();
  });

  it('triggers save when Enter key is pressed in an active input', () => {
    const handleSave = vi.fn();
    render(<ConfigBar config={initialConfig} onSave={handleSave} />);

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }));

    const sessionInput = screen.getByLabelText(/Session ID/i);
    fireEvent.change(sessionInput, { target: { value: 'session-entered' } });
    fireEvent.keyDown(sessionInput, { key: 'Enter', code: 'Enter' });

    expect(handleSave).toHaveBeenCalledWith({
      apiUrl: 'http://localhost:2785',
      apiKey: 'owa_k1_7a62176801cde43df4e13abff974f8a1efe1771e9777078ae22a92809d87202c',
      sessionId: 'session-entered',
    });
  });
});

