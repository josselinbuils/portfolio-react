import { Reducer } from 'react';
import {
  Action,
  ACTION_UPDATE_CLIENT_STATE,
  ACTION_UPDATE_CODE,
  ACTION_UPDATE_CURSORS,
  ACTION_UPDATE_SELECTION,
  UpdateClientStateAction,
  UpdateCodeAction,
  UpdateCursorsAction,
  UpdateSelectionAction,
} from '~/apps/CodeEditor/interfaces/actions';
import { ClientState } from '~/apps/CodeEditor/interfaces/ClientState';
import { applyDiff } from '~/apps/CodeEditor/utils/diffs';

export const handleAction = {
  [ACTION_UPDATE_CLIENT_STATE]: (state, action: UpdateClientStateAction) => ({
    ...state,
    ...action.payload.state,
  }),

  [ACTION_UPDATE_CODE]: (state: ClientState, action: UpdateCodeAction) => {
    const { diffs, newSelection = state.selection } = action.payload;
    const code = diffs.reduce(applyDiff, state.code);
    return { ...state, code, selection: newSelection };
  },

  [ACTION_UPDATE_CURSORS]: (
    state: ClientState,
    action: UpdateCursorsAction
  ) => ({ ...state, cursors: action.payload.cursors }),

  [ACTION_UPDATE_SELECTION]: (
    state: ClientState,
    action: UpdateSelectionAction
  ) => {
    const { clientID, selection } = action.payload;

    if (clientID === state.id) {
      return { ...state, selection };
    }

    const cursorToEdit = state.cursors.find(
      (cursor) => cursor.clientID === clientID
    );
    if (cursorToEdit !== undefined) {
      cursorToEdit.selection = selection;
    }

    return { ...state };
  },
} as { [action: string]: Reducer<ClientState, Action> };
