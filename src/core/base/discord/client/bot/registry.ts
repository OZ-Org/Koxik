import type { Responder } from './types.js';

const responders: Responder[] = [];

export function registerResponder(responder: Responder) {
	responders.push(responder);
}

export function getResponders() {
	return responders;
}
