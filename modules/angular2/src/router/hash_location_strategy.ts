import {DOM} from 'angular2/src/dom/dom_adapter';
import {Injectable} from 'angular2/di';
import {LocationStrategy} from './location_strategy';
import {EventListener, History, Location} from 'angular2/src/facade/browser';

@Injectable()
export class HashLocationStrategy extends LocationStrategy {
  private _location: Location;
  private _history: History;

  constructor() {
    super();
    this._location = DOM.getLocation();
    this._history = DOM.getHistory();
  }

  onPopState(fn: EventListener): void {
    DOM.getGlobalEventTarget('window').addEventListener('popstate', fn, false);
  }

  getBaseHref(): string { return ''; }

  path(): string {
    // the hash value is always prefixed with a `#`
    // and if it is empty then it will stay empty
    return this._location.hash.substring(1);
  }

  pushState(state: any, title: string, url: string) {
    this._history.pushState(state, title, '#' + url);
  }

  forward(): void { this._history.forward(); }

  back(): void { this._history.back(); }
}
