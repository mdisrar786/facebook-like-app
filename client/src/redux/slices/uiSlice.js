import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isDarkMode: false,
    sidebarOpen: true,
    loading: false
  },
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    }
  }
});

export const { toggleTheme, toggleSidebar, setLoading } = uiSlice.actions;
export default uiSlice.reducer;