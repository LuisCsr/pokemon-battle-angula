import { TestBed } from '@angular/core/testing';

import { BattleAi } from './battle-ai';

describe('BattleAi', () => {
  let service: BattleAi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BattleAi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
