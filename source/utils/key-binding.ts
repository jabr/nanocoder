import type {Key} from 'ink';
import type {KeyBindings} from '@/types/config';

export interface ParsedCombo {
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
	meta: boolean;
	baseKey: string;
}

const SPECIAL_KEY_MAP: Record<string, string> = {
	enter: 'return',
	return: 'return',
	tab: 'tab',
	escape: 'escape',
	esc: 'escape',
	backspace: 'backspace',
	delete: 'delete',
	up: 'upArrow',
	down: 'downArrow',
	left: 'leftArrow',
	right: 'rightArrow',
	space: 'space',
};

const MODIFIER_NAMES = new Set(['ctrl', 'shift', 'alt', 'meta', 'cmd', 'super']);

export function parseKeyCombo(combo: string): ParsedCombo {
	if (!combo || combo.trim() === '') {
		throw new Error(`Invalid key combo: empty string`);
	}

	const parts = combo.toLowerCase().split('+').map(p => p.trim());
	const modifiers = {ctrl: false, shift: false, alt: false, meta: false};
	let baseKey = '';

	for (let i = 0; i < parts.length; i++) {
		const part = parts[i];
		if (i < parts.length - 1) {
			// All parts except the last must be modifiers
			if (!MODIFIER_NAMES.has(part)) {
				throw new Error(`Invalid key combo "${combo}": "${part}" is not a modifier (expected ctrl, shift, alt, or meta)`);
			}
			if (part === 'ctrl') modifiers.ctrl = true;
			else if (part === 'shift') modifiers.shift = true;
			else if (part === 'alt') modifiers.alt = true;
			else if (part === 'meta' || part === 'cmd' || part === 'super') modifiers.meta = true;
		} else {
			// Last part is the base key
			baseKey = part;
		}
	}

	if (!baseKey) {
		throw new Error(`Invalid key combo "${combo}": no base key specified`);
	}

	// Reject base key that is a modifier name (e.g. "ctrl+shift" has no real key)
	if (MODIFIER_NAMES.has(baseKey)) {
		throw new Error(`Invalid key combo "${combo}": "${baseKey}" is a modifier, not a key`);
	}

	// Normalize base key name
	const normalizedBase = SPECIAL_KEY_MAP[baseKey] ?? baseKey;

	return {...modifiers, baseKey: normalizedBase};
}

export function matchesKey(combo: string, input: string, key: Key): boolean {
	const parsed = parseKeyCombo(combo);

	// Check modifiers
	if (parsed.ctrl !== !!key.ctrl) return false;
	if (parsed.shift !== !!key.shift) return false;
	if (parsed.alt !== !!key.meta) return false;
	if (parsed.meta !== !!key.super) return false;

	// Match base key
	if (parsed.baseKey === 'space') {
		return input === ' ' && !key.ctrl && !key.meta;
	}

	// Special keys: check the corresponding Ink boolean flag
	const specialKeys = ['return', 'tab', 'escape', 'backspace', 'delete', 'upArrow', 'downArrow', 'leftArrow', 'rightArrow'];
	if (specialKeys.includes(parsed.baseKey)) {
		return !!((key as unknown) as Record<string, boolean>)[parsed.baseKey];
	}

	// Character keys: compare input (case-insensitive for letters)
	if (parsed.baseKey.length === 1) {
		return input.toLowerCase() === parsed.baseKey.toLowerCase();
	}

	return false;
}

export function findAction(
	bindings: Required<KeyBindings>,
	input: string,
	key: Key,
): keyof KeyBindings | null {
	// Check actions with modifier combos first (higher priority)
	const actionKeys = Object.keys(bindings) as (keyof KeyBindings)[];

	// Sort: combos with modifiers first, then plain keys
	const sorted = actionKeys
		.filter(action => {
			const combo = bindings[action];
			return combo && combo.trim() !== '';
		})
		.sort((a, b) => {
			const aHasMod = bindings[a]!.includes('+') ? 1 : 0;
			const bHasMod = bindings[b]!.includes('+') ? 1 : 0;
			return bHasMod - aHasMod;
		});

	for (const action of sorted) {
		const combo = bindings[action]!;
		if (matchesKey(combo, input, key)) {
			return action;
		}
	}

	return null;
}