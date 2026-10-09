import { sanitizeSearch } from './listing.service';

describe('sanitizeSearch', () => {
  it('removes PostgREST filter control characters', () => {
    expect(sanitizeSearch('paris,(city.eq.x)%*')).toBe('paris  city.eq.x');
  });
});
