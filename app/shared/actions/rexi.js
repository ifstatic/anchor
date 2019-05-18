import eos from './helpers/eos';
import * as types from './types';
import {
  addCustomToken,
  clearSettingsCache,
  clearSettingsInvalid,
  removeCustomToken, setSetting, setSettings, setSettingWithValidation
} from './settings';

export function getCPULoans() {
  return (dispatch: () => void, getState) => {
    getLoans('cpuloan', dispatch, getState);
  };
}

export function getNETLoans() {
  return (dispatch: () => void, getState) => {
    getLoans('netloan', dispatch, getState);
  };
}

function getLoans(tableName, dispatch, getState) {
  dispatch({ type: types.SYSTEM_GETTABLE_REQUEST });
  const { connection, settings } = getState();
  const query = {
    json: true,
    code: 'eosio',
    scope: 'eosio',
    table: tableName,
    limit: 1000,
    index_position: 3,
    key_type: 'name',
    lower_bound: settings.account,
    upper_bound: settings.account,
  };
  eos(connection).getTableRows(query).then(results => {
    console.log({results})
    return dispatch({
      type: types.SYSTEM_GETTABLE_SUCCESS,
      payload: {
        ...results,
        code: 'eosio',
        scope: settings.account,
        table: tableName,
      }
    });
  }).catch((err) => {
    return dispatch({
      type: types.SYSTEM_GETTABLE_FAILURE,
      payload: { err },
    });
  });
}

export default {
  getCPULoans,
  getNETLoans,
};
