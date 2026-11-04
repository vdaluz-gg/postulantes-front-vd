import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from '../../core/services/theme.service';
import { ButtonComponent } from './atoms/button/button.component';
import { TextFieldComponent } from './molecules/text-field/text-field.component';
import { ThemeSwitchComponent } from './molecules/theme-switch/theme-switch.component';

@Component({
  imports: [ButtonComponent, TextFieldComponent, ThemeSwitchComponent],
  template: `
    <button appButton variant="pri" size="sm" id="b1">Confirmar</button>
    <a appButton variant="ghost" id="a1" href="/">Volver</a>
    <app-text-field label="Código" inputId="code" [digitsOnly]="true" [(value)]="code" />
    <app-theme-switch />
  `,
})
class HostComponent {
  readonly code = signal('');
}

describe('UI del portal', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [HostComponent] });
  });

  function render() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return { fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('ButtonComponent aplica variante y tamaño, y type solo en <button>', () => {
    const { el } = render();
    const button = el.querySelector('#b1')!;
    expect(button.classList).toContain('pri');
    expect(button.classList).toContain('sm');
    expect(button.getAttribute('type')).toBe('button');
    const link = el.querySelector('#a1')!;
    expect(link.classList).toContain('ghost');
    expect(link.hasAttribute('type')).toBe(false);
  });

  it('TextFieldComponent asocia la etiqueta y descarta lo que no es dígito', () => {
    const { fixture, el } = render();
    const label = el.querySelector('label')!;
    const input = el.querySelector<HTMLInputElement>('#code')!;
    expect(label.getAttribute('for')).toBe('code');
    input.value = '12a3 4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('1234');
    expect(fixture.componentInstance.code()).toBe('1234');
  });

  it('ThemeSwitchComponent marca el tema activo y lo cambia', () => {
    const { fixture, el } = render();
    TestBed.inject(ThemeService).init();
    fixture.detectChanges();
    const group = el.querySelector('app-theme-switch')!;
    expect(group.getAttribute('role')).toBe('group');
    const [dark, light] = Array.from(group.querySelectorAll('button'));
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    light.click();
    fixture.detectChanges();
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');
  });
});
