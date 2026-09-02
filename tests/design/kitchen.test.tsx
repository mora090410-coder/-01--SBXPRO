import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DesignKitchen from '../../src/design/kitchen/DesignKitchen';

describe('DesignKitchen', () => {
  it('renders both bases with every primitive present', () => {
    const { container } = render(<DesignKitchen />);
    expect(container.querySelectorAll('[data-base="dark"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('[data-base="cream"]').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: 'Create your board' }).length).toBe(2);
    expect(screen.getAllByRole('img', { name: /percent/ }).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('Kansas City').length).toBeGreaterThan(0);
  });

  it('uses no icon components', () => {
    const { container } = render(<DesignKitchen />);
    expect(container.querySelectorAll('svg.lucide').length).toBe(0);
  });
});
