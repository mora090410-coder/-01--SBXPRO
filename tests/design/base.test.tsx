import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Base } from '../../src/design/Base';

describe('Base', () => {
  it('sets data-base and ground classes', () => {
    const { container } = render(<Base kind="cream"><p>hi</p></Base>);
    const root = container.firstElementChild as HTMLElement;
    expect(root.dataset.base).toBe('cream');
    expect(root.className).toContain('bg-ground');
    expect(root.className).toContain('text-fg');
    expect(root.className).toContain('font-ui');
  });
});
