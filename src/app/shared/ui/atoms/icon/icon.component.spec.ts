import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';
import { ICONS } from './icons';

@Component({
  imports: [IconComponent],
  template: `
    <svg appIcon="check" id="i1"></svg>
    <svg appIcon="arrow" [flip]="true" id="i2"></svg>
    <svg appIcon="sparkFill" [filled]="true" id="i3"></svg>
  `,
})
class HostComponent {}

describe('IconComponent', () => {
  it('dibuja el trazo del ícono, oculto para lectores de pantalla', () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const icon = el.querySelector('#i1')!;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.querySelector('path')!.getAttribute('d')).toBe(ICONS.check);
    expect(el.querySelector('#i2')!.classList).toContain('flip');
    expect(el.querySelector('#i3')!.classList).toContain('filled');
  });
});
