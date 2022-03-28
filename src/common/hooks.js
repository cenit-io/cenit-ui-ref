import { useReducer } from 'react';

export function spreadReducer(state, newState) {
    if (typeof newState === 'function') {
        newState = newState(state);
    }
    return (newState && { ...state, ...newState }) || state;
}

export function useSpreadState(initialState = {}) {
    return useReducer(spreadReducer, initialState);
}
