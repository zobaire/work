import { createContext, useContext } from 'react';
import { DEFAULT_CURRENCY } from './constants.js';

export const CurrencyContext = createContext(DEFAULT_CURRENCY);
export const useCurrency = () => useContext(CurrencyContext);
