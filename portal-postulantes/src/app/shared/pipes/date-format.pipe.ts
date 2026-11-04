import { Pipe, PipeTransform } from '@angular/core';
import { DateFormat, formatDate } from '../../core/utils/date-format';

/** {{ fecha | appDate: 'time' }} → "10:00". Formatos en core/utils/date-format.ts. */
@Pipe({ name: 'appDate' })
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | null | undefined, format: DateFormat): string {
    return value ? formatDate(value, format) : '';
  }
}
