import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MotionService } from '../../core/services/motion.service';
import { NotificationService } from '../../core/services/notification.service';
import { TodoItemComponent } from './molecules/todo-item/todo-item.component';
import { NotificationIslandComponent } from './organisms/notification-island/notification-island.component';

@Component({
  imports: [TodoItemComponent],
  template: `<div appTodo icon="alert" heading="Confirmá tu reunión" detail="Analista" actionLabel="Confirmar" [completes]="completes()" (action)="done.set(done() + 1)"></div>`,
})
class TodoHost {
  readonly completes = signal(true);
  readonly done = signal(0);
}

describe('TodoItemComponent (tilde que se tacha)', () => {
  let fixture: ComponentFixture<TodoHost>;
  let reduced = false;
  const row = () => fixture.nativeElement.querySelector('[appTodo]') as HTMLElement;

  beforeEach(() => {
    jest.useFakeTimers();
    reduced = false;
    TestBed.configureTestingModule({
      imports: [TodoHost],
      providers: [{ provide: MotionService, useValue: { reduced: () => reduced } }],
    });
    fixture = TestBed.createComponent(TodoHost);
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('se tilda, colapsa a los 850 ms y ejecuta la acción a los 1200 ms', () => {
    row().querySelector('button')!.click();
    fixture.detectChanges();
    expect(row().classList).toContain('done');
    expect(row().querySelector('path')!.getAttribute('d')).toBe('M5 12.5l4.5 4.5L19 7.5');
    expect(fixture.componentInstance.done()).toBe(0);

    jest.advanceTimersByTime(850);
    fixture.detectChanges();
    expect(row().classList).toContain('gone');

    jest.advanceTimersByTime(350);
    expect(fixture.componentInstance.done()).toBe(1);
  });

  it('con movimiento reducido ejecuta la acción al instante', () => {
    reduced = true;
    row().querySelector('button')!.click();
    expect(fixture.componentInstance.done()).toBe(1);
    expect(row().classList).not.toContain('done');
  });

  it('si la acción no resuelve la tarea (por ejemplo, ir a subir), no anima', () => {
    fixture.componentInstance.completes.set(false);
    fixture.detectChanges();
    row().querySelector('button')!.click();
    expect(fixture.componentInstance.done()).toBe(1);
  });
});

describe('NotificationIslandComponent', () => {
  let fixture: ComponentFixture<NotificationIslandComponent>;
  let el: HTMLElement;

  beforeEach(() => {
    jest.useFakeTimers();
    TestBed.configureTestingModule({
      imports: [NotificationIslandComponent],
      providers: [{ provide: MotionService, useValue: { reduced: () => true } }],
    });
    fixture = TestBed.createComponent(NotificationIslandComponent);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => jest.useRealTimers());

  it('anuncia el mensaje en una región viva y lo muestra en la isla', () => {
    TestBed.inject(NotificationService).notify('Confirmaste la reunión.');
    fixture.detectChanges();
    expect(el.querySelector('[role="status"]')!.textContent).toBe('Confirmaste la reunión.');
    expect(el.querySelector('.isl')!.classList).toContain('open');
    expect(el.querySelector('.isl-t')!.textContent).toBe('Confirmaste la reunión.');
  });

  it('inserta el texto como texto, nunca como HTML', () => {
    TestBed.inject(NotificationService).notify('<b>hola</b>');
    fixture.detectChanges();
    expect(el.querySelector('.isl-t b')).toBeNull();
    expect(el.querySelector('.isl-t')!.textContent).toBe('<b>hola</b>');
  });

  it('se va sola a los 6,2 s', () => {
    TestBed.inject(NotificationService).notify('Listo.');
    fixture.detectChanges();
    jest.advanceTimersByTime(6200 + 1300);
    fixture.detectChanges();
    expect(el.querySelector('.isl')).toBeNull();
  });

  it('con acción queda 9 s, ejecuta la acción y se cierra', () => {
    const run = jest.fn();
    TestBed.inject(NotificationService).notify('La sala se abre 15 minutos antes.', { label: 'Agregar al calendario', run });
    fixture.detectChanges();
    jest.advanceTimersByTime(6200 + 1300);
    fixture.detectChanges();
    const button = el.querySelector<HTMLButtonElement>('.isl button')!;
    expect(button.textContent).toBe('Agregar al calendario');
    button.click();
    expect(run).toHaveBeenCalled();
    jest.advanceTimersByTime(1300);
    fixture.detectChanges();
    expect(el.querySelector('.isl')).toBeNull();
  });
});
