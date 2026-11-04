import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Interview, MEETING_ROOM_OPENS_MIN, isMeetingRoomOpen } from '../../../core/models';
import { NotificationService } from '../../../core/services/notification.service';
import { formatDate } from '../../../core/utils/date-format';
import { buildIcs } from '../../../core/utils/ics';
import { PostulanteStore } from '../state/postulante.store';

/** Demora antes de salir hacia la sala del agente, para que se lea el aviso. */
const AGENT_REDIRECT_MS = 700;

/**
 * Acciones del portal que se disparan desde varias vistas (inicio, calendario, mensajes,
 * asistente): unirse a Teams, agendar, confirmar, ir a la entrevista con el agente.
 */
@Injectable({ providedIn: 'root' })
export class PortalActionsService {
  private readonly store = inject(PostulanteStore);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly doc = inject(DOCUMENT);

  /** Abre la reunión si la sala ya está habilitada; si no, avisa cuándo abre y ofrece agendarla. */
  join(interview: Interview): void {
    if (isMeetingRoomOpen(interview, this.store.now())) {
      if (interview.meetingUrl) this.doc.defaultView?.open(interview.meetingUrl, '_blank', 'noopener');
      this.notifications.notify('Abriendo Microsoft Teams…');
      return;
    }
    const opensAt = new Date(interview.startsAt.getTime() - MEETING_ROOM_OPENS_MIN * 60_000);
    this.notifications.notify(
      `La sala se abre 15 minutos antes (${formatDate(interview.startsAt, 'weekday')} ${formatDate(opensAt, 'time')} h). Te avisamos por correo y WhatsApp.`,
      { label: 'Agregar al calendario', run: () => this.addToCalendar(interview) },
    );
  }

  /** Descarga el evento .ics para sumarlo al calendario del teléfono o la compu. */
  addToCalendar(interview: Interview): void {
    const application = this.store.application(interview.applicationId);
    const ics = buildIcs({
      uid: interview.id,
      start: interview.startsAt,
      durationMin: interview.durationMin,
      summary: `${interview.title} - ${application?.title ?? ''}`.trim(),
      description: `Con ${interview.with}. ${interview.type === 'recruiter' ? 'Reunion por Microsoft Teams (link en tu correo).' : ''}`.trim(),
    });
    try {
      const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      const link = this.doc.createElement('a');
      link.href = url;
      link.download = 'entrevista.ics';
      this.doc.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      this.notifications.notify('Listo: se descargó el evento para tu calendario.');
    } catch {
      this.notifications.notify('No pudimos descargar el evento. Probá de nuevo en un rato.');
    }
  }

  confirm(interview: Interview): void {
    this.store.confirmInterview(interview.id);
    this.notifications.notify(
      `Confirmaste tu reunión del ${formatDate(interview.startsAt, 'weekday')} a las ${formatDate(interview.startsAt, 'time')} h.`,
    );
  }

  /** La entrevista con el agente de IA se hace en la sala de la portada. */
  goToAgentRoom(): void {
    this.notifications.notify('Te llevamos a la sala del agente de IA…');
    setTimeout(() => void this.router.navigate(['/']), AGENT_REDIRECT_MS);
  }
}
