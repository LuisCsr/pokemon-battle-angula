import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BattleArena } from './battle-arena';

describe('BattleArena', () => {
  let component: BattleArena;
  let fixture: ComponentFixture<BattleArena>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BattleArena]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BattleArena);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
