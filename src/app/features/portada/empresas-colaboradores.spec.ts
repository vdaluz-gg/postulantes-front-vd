import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MotionService } from '../../core/services/motion.service';
import { HoloAvatarLoaderService } from '../../shared/three/holo-avatar-loader.service';
import {
  cardSteps,
  latestReceipts,
  nextPayday,
  readCertificate,
  topicForQuestion,
} from './colaboradores/collaborator-data';
import { COMPANY_SERVICES, draftProposal, recommendService } from './empresas/company-services';
import { PortadaPage } from './portada.page';

describe('Empresas: datos de ejemplo', () => {
  it('recomienda el servicio según la consulta (y personal eventual si no reconoce nada)', () => {
    expect(recommendService('40 operarios para un pico de producción').id).toBe('eventual');
    expect(recommendService('Un jefe de ventas para CABA').id).toBe('seleccion');
    expect(recommendService('Tercerizar la liquidación de sueldos').id).toBe('capital');
    expect(recommendService('Necesitamos RPO de alto volumen').id).toBe('rpo');
    expect(recommendService('línea de empaque en el depósito').id).toBe('procesos');
    expect(recommendService('hola').id).toBe('eventual');
  });

  it('arma la propuesta con dotación y zona de la consulta', () => {
    const service = COMPANY_SERVICES[1];
    expect(draftProposal('Un jefe de ventas para CABA', service).map((r) => r.value)).toEqual([
      'Búsqueda y selección',
      'A definir',
      'CABA',
      'Lo antes posible · te contactamos hoy',
    ]);
    expect(
      draftProposal('40 operarios en Monte Grande', service)
        .slice(1, 3)
        .map((r) => r.value),
    ).toEqual(['40 personas', 'Monte Grande']);
  });
});

describe('Colaboradores: datos de ejemplo', () => {
  const today = new Date(2026, 10, 6);

  it('reconoce el tema de la pregunta', () => {
    expect(topicForQuestion('¿Cuándo cobro?')).toBe('cobro');
    expect(topicForQuestion('Mi recibo de octubre')).toBe('recibo');
    expect(topicForQuestion('Cargar un certificado')).toBe('cert');
    expect(topicForQuestion('¿Y mi tarjeta?')).toBe('tarjeta');
    expect(topicForQuestion('Quiero cambiar de turno')).toBeNull();
  });

  it('calcula las fechas desde hoy', () => {
    expect(nextPayday(today)).toEqual({ label: '05 de diciembre', countdown: 'en 29 días' });
    expect(nextPayday(new Date(2026, 10, 4))).toEqual({
      label: '05 de noviembre',
      countdown: 'mañana',
    });
    expect(latestReceipts(today).map((r) => [r.title, r.signedOn])).toEqual([
      ['Recibo de octubre', null],
      ['Recibo de septiembre', '06/10'],
    ]);
    expect(latestReceipts(new Date(2027, 0, 15))[0].title).toBe('Recibo de diciembre');
    expect(cardSteps(today).map((s) => s.when)).toEqual(['05/10', '12/10', 'llega el 09/11', '—']);
    expect(readCertificate(today)).toBe('certificado médico · 2 días (04/11 y 05/11)');
  });
});

describe('Paneles de Empresas y Colaboradores', () => {
  let fixture: ComponentFixture<PortadaPage>;
  let el: HTMLElement;

  const render = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r));
    fixture.detectChanges();
  };
  const button = (label: string) =>
    Array.from(el.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent!.trim().startsWith(label),
    )!;
  const chips = () => Array.from(el.querySelectorAll<HTMLButtonElement>('button[appTopicChip]'));
  const pressed = () => chips().map((c) => c.getAttribute('aria-pressed'));
  const peekTitle = () => el.querySelector('[appPeekPanel] .ph')?.textContent!.trim();
  const say = () =>
    el.querySelector('[appPeekPanel] .say')?.textContent!.replace(/\s+/g, ' ').trim();
  const toast = () => el.querySelector('p[appToast]')!.textContent!.trim();
  const open = async (index: number) => {
    el.querySelectorAll<HTMLButtonElement>('app-persona-figure .hit')[index].click();
    await render();
  };
  const ask = async (persona: string, text: string) => {
    const input = el.querySelector<HTMLInputElement>(`#q-${persona}`)!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    input.closest('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    await render();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortadaPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: HoloAvatarLoaderService,
          useValue: {
            create: () => new Promise(() => undefined),
            loadModel: () => new Promise(() => undefined),
          },
        },
        { provide: MotionService, useValue: { reduced: () => true } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(PortadaPage);
    el = fixture.nativeElement;
    await render();
  });

  describe('Empresas', () => {
    beforeEach(() => open(1));

    it('al abrir muestra el primer servicio y cada tema muestra el suyo', async () => {
      expect(pressed()).toEqual(['true', 'false', 'false', 'false', 'false']);
      expect(peekTitle()).toBe('01 · Personal eventual');
      expect(el.querySelectorAll('[appServicePreview] .slots i.f')).toHaveLength(34);
      chips()[3].dispatchEvent(new Event('pointerenter'));
      await render();
      expect(peekTitle()).toBe('04 · Outsourcing de capital humano');
      expect(
        Array.from(el.querySelectorAll('[appServicePreview] .incs li')).map((li) => li.textContent),
      ).toEqual(['Liquidación de sueldos', 'Recibos digitales', 'Atención al colaborador']);
    });

    it('la consulta recomienda un servicio, arma la propuesta y la envía a un asesor', async () => {
      await ask('cli', 'Un jefe de ventas para CABA');
      expect(say()).toBe('Para «Un jefe de ventas para CABA» te recomiendo Búsqueda y selección.');
      expect(pressed()).toEqual(['false', 'true', 'false', 'false', 'false']);

      button('Armar la propuesta').click();
      await render();
      expect(peekTitle()).toBe('Propuesta armada por la IA');
      expect(
        Array.from(el.querySelectorAll('[appProposalForm] dd')).map((d) => d.textContent),
      ).toEqual([
        'Búsqueda y selección',
        'A definir',
        'CABA',
        'Lo antes posible · te contactamos hoy',
      ]);
      const send = button('Enviar a un asesor');
      expect(send.disabled).toBe(false);
      send.click();
      await render();
      expect(say()).toContain('Propuesta enviada.');
      expect(toast()).toBe('Propuesta enviada ✓');
    });

    it('una sugerencia también responde, y "Armar mi propuesta" usa el último servicio elegido', async () => {
      button('Tercerizar la liquidación').click();
      await render();
      expect(say()).toContain('te recomiendo Outsourcing de capital humano');

      chips()[2].click();
      await render();
      button('Armar mi propuesta con IA').click();
      await render();
      expect(el.querySelector('[appProposalForm] dd')!.textContent).toBe('RPO');
    });

    it('"Hablar con un asesor" avisa que un asesor se comunica', async () => {
      button('Hablar con un asesor').click();
      await render();
      expect(toast()).toBe('Un asesor te contacta hoy · 0810-345-4378');
    });
  });

  describe('Colaboradores', () => {
    beforeEach(() => open(2));

    it('al abrir muestra el próximo cobro', () => {
      expect(peekTitle()).toBe('Tu próximo cobro');
      expect(el.querySelector('[appPaydayCard] .big')!.textContent).toMatch(/^05 de [a-z]+$/);
    });

    it('firma el recibo pendiente y queda firmado aunque se cambie de tema', async () => {
      chips()[1].click();
      await render();
      button('Firmar').click();
      await render();
      expect(toast()).toBe('Recibo firmado ✓');
      expect(el.querySelectorAll('[appReceiptList] .ok')).toHaveLength(2);
      chips()[0].click();
      await render();
      chips()[1].click();
      await render();
      expect(el.querySelector('[appReceiptList] button')).toBeNull();
    });

    it('sube un certificado: la IA lo lee y lo carga; rechaza lo que no es foto ni PDF', async () => {
      chips()[2].click();
      await render();
      const fileInput = () =>
        el.querySelector<HTMLInputElement>('[appCertificateDrop] input[type=file]')!;
      expect(fileInput().accept).toBe('image/*,.pdf,application/pdf');
      const choose = async (file: File) => {
        const input = fileInput();
        Object.defineProperty(input, 'files', { value: [file], configurable: true });
        input.dispatchEvent(new Event('change'));
        await render();
      };
      await choose(new File(['x'], 'nota.txt', { type: 'text/plain' }));
      expect(say()).toBe(
        'Ese archivo no es una foto ni un PDF. Sacale una foto al certificado o subilo en PDF.',
      );

      chips()[2].click();
      await render();
      await choose(new File(['x'], 'certificado.jpg', { type: 'image/jpeg' }));
      expect(say()).toMatch(
        /^Certificado cargado\. La IA lo reconoció como certificado médico · 2 días/,
      );
      expect(toast()).toBe('Certificado cargado ✓');
    });

    it('responde desde el legajo y, si no sabe, deriva a atención al colaborador', async () => {
      await ask('col', '¿Y mi tarjeta?');
      expect(peekTitle()).toBe('Tarjeta de débito');
      expect(pressed()).toEqual(['false', 'false', 'false', 'true']);
      await ask('col', 'Quiero cambiar de turno');
      expect(say()).toContain('No encontré eso en tu legajo');
    });

    it('"Gestión Virtual" ofrece los accesos y "Descargar la app" manda el enlace', async () => {
      button('Gestión Virtual').click();
      await render();
      expect(peekTitle()).toBe('Gestión Virtual');
      el.querySelectorAll<HTMLButtonElement>('[appPeekPanel] .links button')[1].click();
      await render();
      expect(peekTitle()).toBe('Tus recibos');

      button('Descargar la app').click();
      await render();
      button('Mandarme el enlace').click();
      await render();
      expect(toast()).toBe('Te mandamos el enlace por WhatsApp ✓');
    });
  });
});
