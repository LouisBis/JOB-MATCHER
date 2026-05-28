import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LABELS } from '../../i18n/fr';

/**
 * Top navigation bar — present on all pages.
 * Uses RouterLinkActive to highlight the current route.
 */
@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navbar.component.html',
    styleUrl: './navbar.component.scss'
})
export class NavbarComponent {
  readonly labels = LABELS.nav;
}
