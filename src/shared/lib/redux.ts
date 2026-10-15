import type { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Typed hooks that do not depend on the root state type, so lower layers can use them without
 * importing from the app layer. Selectors declare the slice of state they read.
 */
export const useAppDispatch =
  useDispatch.withTypes<ThunkDispatch<unknown, unknown, UnknownAction>>();
export const useAppSelector = useSelector;
