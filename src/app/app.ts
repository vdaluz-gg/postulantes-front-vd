import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationIslandComponent } from './shared/ui/organisms/notification-island/notification-island.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationIslandComponent],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
