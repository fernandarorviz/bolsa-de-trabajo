import { render, screen } from '@testing-library/react';
import { PDFViewerDialog } from './PDFViewerDialog';
import { describe, it, expect, vi } from 'vitest';

describe('PDFViewerDialog', () => {
  const mockOnOpenChange = vi.fn();
  const pdfUrl = 'https://example.com/cv.pdf';
  const candidateName = 'Juan Pérez';

  it('renders correctly when open', () => {
    render(
      <PDFViewerDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        pdfUrl={pdfUrl}
        candidateName={candidateName}
      />
    );

    expect(screen.getByText(`CV: ${candidateName}`)).toBeDefined();
    const iframe = screen.getByTitle(`CV de ${candidateName}`);
    expect(iframe).toBeDefined();
    expect(iframe.getAttribute('src')).toContain(pdfUrl);
  });

  it('does not render when closed', () => {
    render(
      <PDFViewerDialog
        isOpen={false}
        onOpenChange={mockOnOpenChange}
        pdfUrl={pdfUrl}
        candidateName={candidateName}
      />
    );

    expect(screen.queryByText(`CV: ${candidateName}`)).toBeNull();
  });

  it('does not render when pdfUrl is null', () => {
    render(
      <PDFViewerDialog
        isOpen={true}
        onOpenChange={mockOnOpenChange}
        pdfUrl={null}
        candidateName={candidateName}
      />
    );

    expect(screen.queryByText(`CV: ${candidateName}`)).toBeNull();
  });
});
