import { describe, expect, it } from 'vitest';
import { enLigne, paragraphes } from './markdown';

describe('markdown des récits', () => {
  it('échappe le HTML avant de mettre en forme', () => {
    expect(enLigne('<script>**gras**')).toBe('&lt;script&gt;<strong>gras</strong>');
  });
  it('rend les liens internes et externes, ignore les autres schémas', () => {
    expect(enLigne('[loi](/lois/2023-270)')).toBe('<a href="/lois/2023-270">loi</a>');
    expect(enLigne('[AN](https://x.fr)')).toBe('<a href="https://x.fr" rel="external">AN</a>');
    expect(enLigne('[x](javascript:alert)')).toBe('x');
  });
  it('découpe en paragraphes', () => {
    expect(paragraphes('a\nb\n\n*c*')).toBe('<p>a b</p><p><em>c</em></p>');
  });
});
