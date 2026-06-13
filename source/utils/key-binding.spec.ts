import test from 'ava';
import {parseKeyCombo, matchesKey, findAction} from './key-binding.js';
import type {KeyBindings} from '@/types/config';
import {DEFAULT_KEY_BINDINGS} from '@/types/config';

// Mock Ink Key object
function mockKey(overrides: Partial<Record<string, boolean>> = {}): any {
	return {
		upArrow: false,
		downArrow: false,
		leftArrow: false,
		rightArrow: false,
		pageDown: false,
		pageUp: false,
		home: false,
		end: false,
		return: false,
		escape: false,
		ctrl: false,
		shift: false,
		tab: false,
		backspace: false,
		delete: false,
		meta: false,
		super: false,
		hyper: false,
		capsLock: false,
		numLock: false,
		...overrides,
	};
}

test('parseKeyCombo: parses simple key', t => {
	const result = parseKeyCombo('enter');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'return'});
});

test('parseKeyCombo: parses ctrl+letter', t => {
	const result = parseKeyCombo('ctrl+o');
	t.deepEqual(result, {ctrl: true, shift: false, alt: false, meta: false, baseKey: 'o'});
});

test('parseKeyCombo: parses shift+tab', t => {
	const result = parseKeyCombo('shift+tab');
	t.deepEqual(result, {ctrl: false, shift: true, alt: false, meta: false, baseKey: 'tab'});
});

test('parseKeyCombo: parses ctrl+j', t => {
	const result = parseKeyCombo('ctrl+j');
	t.deepEqual(result, {ctrl: true, shift: false, alt: false, meta: false, baseKey: 'j'});
});

test('parseKeyCombo: parses ctrl+m', t => {
	const result = parseKeyCombo('ctrl+m');
	t.deepEqual(result, {ctrl: true, shift: false, alt: false, meta: false, baseKey: 'm'});
});

test('parseKeyCombo: parses alt+f', t => {
	const result = parseKeyCombo('alt+f');
	t.deepEqual(result, {ctrl: false, shift: false, alt: true, meta: false, baseKey: 'f'});
});

test('parseKeyCombo: parses ctrl+shift+letter', t => {
	const result = parseKeyCombo('ctrl+shift+a');
	t.deepEqual(result, {ctrl: true, shift: true, alt: false, meta: false, baseKey: 'a'});
});

test('parseKeyCombo: rejects empty string', t => {
	t.throws(() => parseKeyCombo(''));
});

test('parseKeyCombo: rejects unknown modifier', t => {
	t.throws(() => parseKeyCombo('foobar+enter'));
});

test('matchesKey: matches enter', t => {
	t.true(matchesKey('enter', '', mockKey({return: true})));
});

test('matchesKey: matches ctrl+o', t => {
	t.true(matchesKey('ctrl+o', 'o', mockKey({ctrl: true})));
});

test('matchesKey: matches shift+tab', t => {
	t.true(matchesKey('shift+tab', '', mockKey({shift: true, tab: true})));
});

test('matchesKey: matches ctrl+j', t => {
	t.true(matchesKey('ctrl+j', 'j', mockKey({ctrl: true})));
});

test('matchesKey: does not match wrong modifier', t => {
	t.false(matchesKey('ctrl+o', 'o', mockKey({shift: true})));
});

test('matchesKey: does not match wrong key', t => {
	t.false(matchesKey('ctrl+o', 'r', mockKey({ctrl: true})));
});

test('findAction: returns correct action for default bindings', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, '', mockKey({return: true}));
	t.is(action, 'submit');
});

test('findAction: returns correct action for ctrl+o', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, 'o', mockKey({ctrl: true}));
	t.is(action, 'toggleCompactDisplay');
});

test('findAction: returns null for unbound key', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, 'x', mockKey());
	t.is(action, null);
});

test('findAction: prioritizes modifier combos over plain keys', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		submit: 'enter',
		newline: 'shift+enter',
		newlineAlt: 'ctrl+j',
		toggleMode: 'shift+tab',
		toggleCompactDisplay: 'ctrl+o',
		toggleReasoningExpanded: 'ctrl+r',
		openModelSelector: '',
	};
	// shift+enter should match 'newline', not 'submit'
	const action = findAction(bindings, '', mockKey({shift: true, return: true}));
	t.is(action, 'newline');
});

test('findAction: custom override takes precedence', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		submit: 'ctrl+enter',
		newline: 'enter',
		newlineAlt: 'ctrl+j',
		toggleMode: 'shift+tab',
		toggleCompactDisplay: 'ctrl+o',
		toggleReasoningExpanded: 'ctrl+r',
		openModelSelector: 'ctrl+m',
	};
	// Plain enter should now be 'newline', not 'submit'
	const action = findAction(bindings, '', mockKey({return: true}));
	t.is(action, 'newline');
	// ctrl+enter should be 'submit'
	const action2 = findAction(bindings, '', mockKey({ctrl: true, return: true}));
	t.is(action2, 'submit');
});

// --- Additional parseKeyCombo edge cases ---

test('parseKeyCombo: parses return as alias for enter', t => {
	const result = parseKeyCombo('return');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'return'});
});

test('parseKeyCombo: parses esc as alias for escape', t => {
	const result = parseKeyCombo('esc');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'escape'});
});

test('parseKeyCombo: parses space', t => {
	const result = parseKeyCombo('space');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'space'});
});

test('parseKeyCombo: parses arrow keys', t => {
	t.is(parseKeyCombo('up').baseKey, 'upArrow');
	t.is(parseKeyCombo('down').baseKey, 'downArrow');
	t.is(parseKeyCombo('left').baseKey, 'leftArrow');
	t.is(parseKeyCombo('right').baseKey, 'rightArrow');
});

test('parseKeyCombo: parses delete', t => {
	const result = parseKeyCombo('delete');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'delete'});
});

test('parseKeyCombo: parses backspace', t => {
	const result = parseKeyCombo('backspace');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: false, baseKey: 'backspace'});
});

test('parseKeyCombo: is case-insensitive', t => {
	const result = parseKeyCombo('Ctrl+O');
	t.deepEqual(result, {ctrl: true, shift: false, alt: false, meta: false, baseKey: 'o'});
});

test('parseKeyCombo: handles whitespace around parts', t => {
	const result = parseKeyCombo('ctrl + o');
	t.deepEqual(result, {ctrl: true, shift: false, alt: false, meta: false, baseKey: 'o'});
});

test('parseKeyCombo: cmd is treated as meta', t => {
	const result = parseKeyCombo('cmd+s');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: true, baseKey: 's'});
});

test('parseKeyCombo: super is treated as meta', t => {
	const result = parseKeyCombo('super+x');
	t.deepEqual(result, {ctrl: false, shift: false, alt: false, meta: true, baseKey: 'x'});
});

test('parseKeyCombo: allows ctrl+shift with non-letter base', t => {
	// ctrl+shift+digit should NOT be rejected (only letters are ambiguous)
	const result = parseKeyCombo('ctrl+shift+1');
	t.deepEqual(result, {ctrl: true, shift: true, alt: false, meta: false, baseKey: '1'});
});

test('parseKeyCombo: allows alt+shift+letter', t => {
	const result = parseKeyCombo('alt+shift+a');
	t.deepEqual(result, {ctrl: false, shift: true, alt: true, meta: false, baseKey: 'a'});
});

test('parseKeyCombo: rejects combo with only modifiers', t => {
	t.throws(() => parseKeyCombo('ctrl+shift'));
});

// --- Additional matchesKey edge cases ---

test('matchesKey: matches space', t => {
	t.true(matchesKey('space', ' ', mockKey()));
});

test('matchesKey: space does not match with ctrl held', t => {
	t.false(matchesKey('space', ' ', mockKey({ctrl: true})));
});

test('matchesKey: matches escape', t => {
	t.true(matchesKey('escape', '', mockKey({escape: true})));
});

test('matchesKey: matches backspace', t => {
	t.true(matchesKey('backspace', '', mockKey({backspace: true})));
});

test('matchesKey: matches delete', t => {
	t.true(matchesKey('delete', '', mockKey({delete: true})));
});

test('matchesKey: matches arrow keys', t => {
	t.true(matchesKey('up', '', mockKey({upArrow: true})));
	t.true(matchesKey('down', '', mockKey({downArrow: true})));
	t.true(matchesKey('left', '', mockKey({leftArrow: true})));
	t.true(matchesKey('right', '', mockKey({rightArrow: true})));
});

test('matchesKey: matches ctrl+m (carriage return encoding)', t => {
	// Ctrl+M sends the same bytes as Enter in terminals,
	// but Ink reports it as ctrl+m, not key.return
	t.true(matchesKey('ctrl+m', 'm', mockKey({ctrl: true})));
});

test('matchesKey: does not match enter when shift is held', t => {
	// 'enter' should not match shift+enter because shift modifier differs
	t.false(matchesKey('enter', '', mockKey({return: true, shift: true})));
});

test('matchesKey: matches shift+enter', t => {
	t.true(matchesKey('shift+enter', '', mockKey({return: true, shift: true})));
});

test('matchesKey: letter matching is case-insensitive', t => {
	t.true(matchesKey('ctrl+o', 'O', mockKey({ctrl: true})));
});

test('matchesKey: alt modifier matches key.meta', t => {
	t.true(matchesKey('alt+f', 'f', mockKey({meta: true})));
});

test('matchesKey: meta modifier matches key.super', t => {
	t.true(matchesKey('cmd+s', 's', mockKey({super: true})));
});

// --- Additional findAction edge cases ---

test('findAction: skips actions with empty string bindings', t => {
	// openModelSelector is '' by default, should never match
	const action = findAction(DEFAULT_KEY_BINDINGS, '', mockKey());
	t.is(action, null);
});

test('findAction: matches ctrl+r for toggleReasoningExpanded', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, 'r', mockKey({ctrl: true}));
	t.is(action, 'toggleReasoningExpanded');
});

test('findAction: matches shift+tab for toggleMode', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, '', mockKey({shift: true, tab: true}));
	t.is(action, 'toggleMode');
});

test('findAction: ctrl+r does not match with wrong modifier', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, 'r', mockKey({shift: true}));
	t.is(action, null);
});

test('findAction: partial override merges with defaults', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		submit: 'ctrl+enter',
	};
	// ctrl+enter should now be submit
	const action = findAction(bindings, '', mockKey({ctrl: true, return: true}));
	t.is(action, 'submit');
	// shift+tab should still be toggleMode (from defaults)
	const action2 = findAction(bindings, '', mockKey({shift: true, tab: true}));
	t.is(action2, 'toggleMode');
});

test('findAction: plain letter key without modifiers returns null for default bindings', t => {
	// Pressing 'o' without ctrl should not match anything
	const action = findAction(DEFAULT_KEY_BINDINGS, 'o', mockKey());
	t.is(action, null);
});

test('findAction: tab alone does not match toggleMode', t => {
	// Tab without shift should not match shift+tab binding
	const action = findAction(DEFAULT_KEY_BINDINGS, '', mockKey({tab: true}));
	t.is(action, null);
});

test('findAction: ctrl+j matches newlineAlt', t => {
	const action = findAction(DEFAULT_KEY_BINDINGS, 'j', mockKey({ctrl: true}));
	t.is(action, 'newlineAlt');
});

// --- DEFAULT_KEY_BINDINGS structure tests ---

test('DEFAULT_KEY_BINDINGS: has all required fields', t => {
	const keys = Object.keys(DEFAULT_KEY_BINDINGS) as (keyof KeyBindings)[];
	t.true(keys.includes('submit'));
	t.true(keys.includes('newline'));
	t.true(keys.includes('newlineAlt'));
	t.true(keys.includes('toggleMode'));
	t.true(keys.includes('toggleCompactDisplay'));
	t.true(keys.includes('toggleReasoningExpanded'));
	t.true(keys.includes('openModelSelector'));
	t.true(keys.includes('exit'));
});

test('DEFAULT_KEY_BINDINGS: openModelSelector defaults to empty string', t => {
	t.is(DEFAULT_KEY_BINDINGS.openModelSelector, '');
});

test('DEFAULT_KEY_BINDINGS: exit defaults to empty string', t => {
	t.is(DEFAULT_KEY_BINDINGS.exit, '');
});

// --- Array binding tests ---

test('findAction: matches first combo in array', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		submit: ['ctrl+enter', 'ctrl+m'],
	};
	t.is(findAction(bindings, '', mockKey({ctrl: true, return: true})), 'submit');
	t.is(findAction(bindings, 'm', mockKey({ctrl: true})), 'submit');
});

test('findAction: matches second combo in array', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		newline: ['enter', 'shift+enter'],
	};
	t.is(findAction(bindings, '', mockKey({return: true})), 'newline');
	t.is(findAction(bindings, '', mockKey({return: true, shift: true})), 'newline');
});

test('findAction: empty string in array is skipped', t => {
	const bindings: Required<KeyBindings> = {
		...DEFAULT_KEY_BINDINGS,
		exit: ['', 'ctrl+d'],
	};
	t.is(findAction(bindings, 'd', mockKey({ctrl: true})), 'exit');
	t.is(findAction(bindings, '', mockKey()), null);
});