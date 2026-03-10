import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

import VideoList from '@/app/(moderator)/moderator/videos/VideoList';
import type { VideoRow } from '@/app/(moderator)/moderator/videos/VideoList';

function makeVideo(id: string, overrides: Partial<VideoRow> = {}): VideoRow {
  return {
    id,
    title: `Video ${id}`,
    youtube_id: `yt${id}`,
    thumbnail_url: null,
    status: 'approved',
    category: 'education',
    age_band: '3-5',
    approval_count: 1,
    rejection_count: 0,
    ...overrides
  };
}

describe('VideoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video title and status badge', () => {
    render(<VideoList initialVideos={[makeVideo('1')]} />);
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    // Badge is a <span>, not a button — there are multiple "Approved" text nodes (filter tab + badge)
    const approvedNodes = screen.getAllByText('Approved');
    expect(approvedNodes.length).toBeGreaterThanOrEqual(1);
    // At least one should not be a button (the badge)
    expect(approvedNodes.some((el) => el.tagName !== 'BUTTON')).toBe(true);
  });

  it('renders multiple videos', () => {
    render(<VideoList initialVideos={[makeVideo('1'), makeVideo('2')]} />);
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
  });

  it('shows empty state when no videos match filter', async () => {
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    await user.click(screen.getByRole('button', { name: 'Rejected' }));
    expect(screen.getByText(/no videos in this category/i)).toBeInTheDocument();
  });

  it('filter tab "Approved" shows only approved videos', async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        initialVideos={[
          makeVideo('1', { status: 'approved' }),
          makeVideo('2', { status: 'rejected' }),
          makeVideo('3', { status: 'pending' })
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Approved' }));
    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.queryByText('Video 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Video 3')).not.toBeInTheDocument();
  });

  it('filter tab "Pending" shows only pending videos', async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        initialVideos={[
          makeVideo('1', { status: 'approved' }),
          makeVideo('2', { status: 'pending' })
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Pending' }));
    expect(screen.queryByText('Video 1')).not.toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
  });

  it('filter tab "Rejected" shows rejected and suspended videos', async () => {
    const user = userEvent.setup();
    render(
      <VideoList
        initialVideos={[
          makeVideo('1', { status: 'approved' }),
          makeVideo('2', { status: 'rejected' }),
          makeVideo('3', { status: 'suspended' })
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Rejected' }));
    expect(screen.queryByText('Video 1')).not.toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Video 3')).toBeInTheDocument();
  });

  it('shows reject button on approved video', () => {
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    expect(
      screen.getByRole('button', { name: /remove from catalog/i })
    ).toBeInTheDocument();
  });

  it('shows restore button on rejected video', () => {
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'rejected' })]} />
    );
    expect(
      screen.getByRole('button', { name: /restore/i })
    ).toBeInTheDocument();
  });

  it('shows restore button on suspended video', () => {
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'suspended' })]} />
    );
    expect(
      screen.getByRole('button', { name: /restore/i })
    ).toBeInTheDocument();
  });

  it('no action buttons for pending videos', () => {
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'pending' })]} />
    );
    expect(
      screen.queryByRole('button', { name: /remove from catalog/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /restore/i })
    ).not.toBeInTheDocument();
  });

  it('reject button calls PATCH with action: reject', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', status: 'rejected' })
    });
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    await user.click(
      screen.getByRole('button', { name: /remove from catalog/i })
    );
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/moderator/videos/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'reject' })
        })
      );
    });
  });

  it('restore button calls PATCH with action: restore', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', status: 'approved' })
    });
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'rejected' })]} />
    );
    await user.click(screen.getByRole('button', { name: /restore/i }));
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/moderator/videos/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'restore' })
        })
      );
    });
  });

  it('updates status in place on success (video stays in list)', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', status: 'rejected' })
    });
    const user = userEvent.setup();
    // Two videos: action on first, second should stay unchanged
    render(
      <VideoList
        initialVideos={[
          makeVideo('1', { status: 'approved' }),
          makeVideo('2', { status: 'approved' })
        ]}
      />
    );
    const rejectBtns = screen.getAllByRole('button', {
      name: /remove from catalog/i
    });
    await user.click(rejectBtns[0]);
    await waitFor(() => {
      expect(screen.getByText('Video 1')).toBeInTheDocument();
      expect(screen.getByText('Video 2')).toBeInTheDocument();
      const card1 = screen.getByText('Video 1').closest('.card-warm');
      expect(card1).toBeInTheDocument();
      expect(
        within(card1! as HTMLElement).getByText('Rejected')
      ).toBeInTheDocument();
    });
  });

  it('shows error message on PATCH failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Not allowed' })
    });
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    await user.click(
      screen.getByRole('button', { name: /remove from catalog/i })
    );
    await waitFor(() => {
      expect(screen.getByText('Not allowed')).toBeInTheDocument();
    });
    expect(screen.getByText('Video 1')).toBeInTheDocument();
  });

  it('shows fallback error when response has no error field', async () => {
    mockFetch.mockResolvedValue({ ok: false, json: async () => ({}) });
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    await user.click(
      screen.getByRole('button', { name: /remove from catalog/i })
    );
    await waitFor(() => {
      expect(screen.getByText('Something went wrong.')).toBeInTheDocument();
    });
  });

  it('shows error when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    await user.click(
      screen.getByRole('button', { name: /remove from catalog/i })
    );
    await waitFor(() => {
      expect(
        screen.getByText(/could not reach the server/i)
      ).toBeInTheDocument();
    });
  });

  it('disables button while request is pending', async () => {
    let resolve: (v: unknown) => void;
    mockFetch.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      })
    );
    const user = userEvent.setup();
    render(
      <VideoList initialVideos={[makeVideo('1', { status: 'approved' })]} />
    );
    const btn = screen.getByRole('button', { name: /remove from catalog/i });
    await user.click(btn);
    expect(btn).toBeDisabled();
    resolve!({ ok: true, json: async () => ({ id: '1', status: 'rejected' }) });
  });

  it('shows thumbnail image when thumbnail_url is set', () => {
    render(
      <VideoList
        initialVideos={[
          makeVideo('1', { thumbnail_url: 'https://example.com/thumb.jpg' })
        ]}
      />
    );
    expect(screen.getByAltText('Video 1')).toBeInTheDocument();
  });

  it('shows fallback emoji when thumbnail_url is null', () => {
    render(
      <VideoList initialVideos={[makeVideo('1', { thumbnail_url: null })]} />
    );
    expect(screen.getByText('📺')).toBeInTheDocument();
  });

  it('shows empty state when no videos provided', () => {
    render(<VideoList initialVideos={[]} />);
    expect(screen.getByText(/no videos in this category/i)).toBeInTheDocument();
  });
});
