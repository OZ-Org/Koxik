import type { Responder, ResponderType } from './types.js';

const responders: Responder<ResponderType>[] = [];

export function registerResponder(responder: Responder<ResponderType>) {
	responders.push(responder);
}

export function getResponders(): Responder<ResponderType>[] {
	return responders;
}
