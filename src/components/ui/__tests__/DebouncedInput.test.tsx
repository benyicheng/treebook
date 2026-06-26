import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import DebouncedInput from '../DebouncedInput';

describe('DebouncedInput', () => {
  it('renders with placeholder', () => {
    render(<DebouncedInput onChange={vi.fn()} placeholder="搜索..." />);
    expect(screen.getByPlaceholderText('搜索...')).toBeInTheDocument();
  });

  it('debounces onChange call', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<DebouncedInput onChange={onChange} delay={300} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'hello' } });

    // onChange should not be called immediately
    expect(onChange).not.toHaveBeenCalled();

    // After 300ms it should fire
    act(() => { vi.advanceTimersByTime(300); });
    expect(onChange).toHaveBeenCalledWith('hello');
    expect(onChange).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('syncs external value changes', () => {
    const { rerender } = render(<DebouncedInput value="abc" onChange={vi.fn()} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('abc');

    rerender(<DebouncedInput value="" onChange={vi.fn()} />);
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('supports custom delay', async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    render(<DebouncedInput onChange={onChange} delay={500} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'x' } });
    act(() => { vi.advanceTimersByTime(499); });
    expect(onChange).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(1); });
    expect(onChange).toHaveBeenCalledWith('x');

    vi.useRealTimers();
  });
});
