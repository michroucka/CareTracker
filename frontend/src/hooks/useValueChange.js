import React from "react";

/**
 * Calls `onChange(value)` while rendering whenever `value` differs from the previous render, so state that
 * depends on it is adjusted before React paints instead of one render later in an effect
 * (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
 * `onChange` may only set state of the calling component.
 */
export function useValueChange(value, onChange) {
    const [previous, setPrevious] = React.useState(value);
    if (!Object.is(previous, value)) {
        setPrevious(value);
        onChange(value);
    }
}
