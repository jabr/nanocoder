import chalk from 'chalk';
import {Text, useInput} from 'ink';
import {useEffect, useState} from 'react';
import {wrapWithTrimmedContinuations} from '@/utils/text-wrapping';

export type Props = {
	readonly placeholder?: string;
	readonly focus?: boolean;
	readonly mask?: string;
	readonly showCursor?: boolean;
	readonly highlightPastedText?: boolean;
	readonly value: string;
	readonly onChange: (value: string) => void;
	readonly onSubmit?: (value: string) => void;
	readonly wrapWidth?: number;
};

function TextInput({
	value: originalValue,
	placeholder = '',
	focus = true,
	mask,
	highlightPastedText = false,
	showCursor = true,
	onChange,
	onSubmit,
	wrapWidth,
}: Props) {
	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
	});

	const {cursorOffset, cursorWidth} = state;

	useEffect(() => {
		setState(previousState => {
			if (!focus || !showCursor) {
				return previousState;
			}

			const newValue = originalValue || '';

			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}

			return previousState;
		});
	}, [originalValue, focus, showCursor]);

	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;
	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	if (showCursor && focus) {
		renderedPlaceholder =
			placeholder.length > 0
				? chalk.inverse(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: chalk.inverse(' ');

		renderedValue = value.length > 0 ? '' : chalk.inverse(' ');

		let i = 0;

		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? chalk.inverse(char)
					: char;

			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += chalk.inverse(' ');
		}
	}

	useInput(
		(input, key) => {
			// Swallow keys that UserInput handles or that should never insert
			// characters. UserInput's useInput fires separately for these.
			if (
				key.upArrow ||
				key.downArrow ||
				(key.ctrl && input === 'c') ||
				key.tab
			) {
				return;
			}

			// Enter: call onSubmit if provided (used by question-prompt, wizards, etc.)
			// UserInput handles its own submit/newline via findAction and doesn't pass onSubmit.
			if (key.return) {
				if (onSubmit) {
					onSubmit(originalValue);
				}
				return;
			}

			let nextCursorOffset = cursorOffset;
			let nextValue = originalValue;
			let nextCursorWidth = 0;

			if (key.ctrl) {
				// Readline keybinds
				switch (input) {
					case 'a': {
						// Move cursor to start of line
						nextCursorOffset = 0;
						break;
					}

					case 'e': {
						// Move cursor to end of line
						nextCursorOffset = originalValue.length;
						break;
					}

					case 'b': {
						// Move cursor back one character
						if (showCursor) {
							nextCursorOffset--;
						}

						break;
					}

					case 'f': {
						// Move cursor forward one character
						if (showCursor) {
							nextCursorOffset++;
						}

						break;
					}

					case 'w': {
						// Delete previous word (backward-kill-word)
						if (cursorOffset > 0) {
							let i = cursorOffset;

							// Skip whitespace immediately before cursor
							while (i > 0 && originalValue[i - 1] === ' ') {
								i--;
							}

							// Delete back to next whitespace or start
							while (i > 0 && originalValue[i - 1] !== ' ') {
								i--;
							}

							nextValue =
								originalValue.slice(0, i) + originalValue.slice(cursorOffset);
							nextCursorOffset = i;
						}

						break;
					}

					case 'u': {
						// Delete from cursor to start of line
						nextValue = originalValue.slice(cursorOffset);
						nextCursorOffset = 0;
						break;
					}

					case 'k': {
						// Delete from cursor to end of line
						nextValue = originalValue.slice(0, cursorOffset);
						break;
					}

					case 'd': {
						// Forward delete: remove character after cursor
						if (cursorOffset < originalValue.length) {
							nextValue =
								originalValue.slice(0, cursorOffset) +
								originalValue.slice(cursorOffset + 1);
						}
						break;
					}

					case 'h':
					case 'backspace': {
						// Backward delete
						if (cursorOffset > 0) {
							nextValue =
								originalValue.slice(0, cursorOffset - 1) +
								originalValue.slice(cursorOffset);
							nextCursorOffset--;
						}
						break;
					}

					default:
						// Ignore all other ctrl combinations (don't insert characters)
						break;
				}
			} else if (key.leftArrow) {
				if (showCursor) {
					nextCursorOffset--;
				}
			} else if (key.rightArrow) {
				if (showCursor) {
					nextCursorOffset++;
				}
			} else if (key.delete || key.backspace) {
				// Backward delete (Mac "delete", backspace, ctrl+h via key.backspace)
				if (cursorOffset > 0) {
					nextValue =
						originalValue.slice(0, cursorOffset - 1) +
						originalValue.slice(cursorOffset);
					nextCursorOffset--;
				}
			} else {
				nextValue =
					originalValue.slice(0, cursorOffset) +
					input +
					originalValue.slice(cursorOffset, originalValue.length);
				nextCursorOffset += input.length;

				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			}

			if (nextCursorOffset < 0) {
				nextCursorOffset = 0;
			}

			if (nextCursorOffset > nextValue.length) {
				nextCursorOffset = nextValue.length;
			}

			setState({
				cursorOffset: nextCursorOffset,
				cursorWidth: nextCursorWidth,
			});

			if (nextValue !== originalValue) {
				onChange(nextValue);
			}
		},
		{isActive: focus},
	);

	const finalValue = placeholder
		? value.length > 0
			? renderedValue
			: renderedPlaceholder
		: renderedValue;

	const displayValue =
		wrapWidth && wrapWidth > 0 && finalValue
			? wrapWithTrimmedContinuations(finalValue, wrapWidth)
			: finalValue;

	return <Text>{displayValue}</Text>;
}

export default TextInput;