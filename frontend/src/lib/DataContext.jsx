import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchPhotographers, fetchSpots } from "./api";
import { PHOTOGRAPHERS as MOCK_PHOTOGRAPHERS, SPOTS as MOCK_SPOTS } from "../data";

const DataContext = createContext({
  photographers: [],
  spots: [],
  loading: true,
  error: null,
  reload: async () => {},
});

// Falls back to mock data when the API is unreachable so the UI keeps working
// during local dev before the DB is provisioned/seeded.
export function DataProvider({ children }) {
  const [state, setState] = useState({ photographers: [], spots: [], loading: true, error: null });

  const reload = useCallback(async () => {
    try {
      const [photographers, spots] = await Promise.all([fetchPhotographers(), fetchSpots()]);
      setState({ photographers, spots, loading: false, error: null });
    } catch (err) {
      console.warn("API unreachable, using mock data:", err.message);
      setState(prev => (prev.photographers.length
        ? { ...prev, loading: false, error: err }
        : { photographers: MOCK_PHOTOGRAPHERS, spots: MOCK_SPOTS, loading: false, error: err }));
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => ({ ...state, reload }), [state, reload]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
