import {createContext, useContext} from 'react';
import type {KeyBindings} from '@/types/config';
import {DEFAULT_KEY_BINDINGS} from '@/types/config';

export const KeyBindingsContext = createContext<Required<KeyBindings>>(DEFAULT_KEY_BINDINGS);

export function useKeyBindings(): Required<KeyBindings> {
	return useContext(KeyBindingsContext);
}