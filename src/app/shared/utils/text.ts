/** Texto en minúscula y sin tildes, para comparar búsquedas ("Administración" = "administracion"). */
export const normalize = (text: string): string =>
  text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
