
import { create } from 'zustand';
import { createUISlice, UISlice } from './slices/uiSlice';
import { createProjectSlice, ProjectSlice } from './slices/projectSlice';
import { createSessionSlice, SessionSlice } from './slices/sessionSlice';

type AppState = UISlice & ProjectSlice & SessionSlice;

export const useStore = create<AppState>((...a) => ({
    ...createUISlice(...a),
    ...createProjectSlice(...a),
    ...createSessionSlice(...a),
}));
