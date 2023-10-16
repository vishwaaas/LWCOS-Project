/**
 * @event LightningFormattedLookup#onprivatelookupitempicked
 * @type {object}
 * @property {string} recordId
 */
export class PrivateLookupItemPickedEvent extends CustomEvent {
  constructor({
    recordId
  }) {
    super(PrivateLookupItemPickedEvent.NAME, {
      composed: true,
      cancelable: true,
      bubbles: true,
      detail: {
        recordId
      }
    });
  }
  /*LWC compiler v3.0.0*/
}
PrivateLookupItemPickedEvent.NAME = 'privatelookupitempicked';