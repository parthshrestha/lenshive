import { createContext, useContext, useEffect, useState } from "react";
import { fetchPhotographers, fetchSpots } from "./api";
import { PHOTOGRAPHERS as MOCK_PHOTOGRAPHERS, SPOTS as MOCK_SPOTS } from "../data";

const DataContext = createContext({
  photographers: [],
  spots: [],
  loading: true,
  error: null,
});

// Falls back to mock data when the API is unreachable so the UI keeps working
// during local dev before the DB is provisioned/seeded.
export function DataProvider({ children }) {
  const [state, setState] = useState({ photographers: [], spots: [], loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [photographers, spots] = await Promise.all([fetchPhotographers(), fetchSpots()]);
        if (!cancelled) setState({ photographers, spots, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          console.warn("API unreachable, using mock data:", err.message);
          setState({ photographers: MOCK_PHOTOGRAPHERS, spots: MOCK_SPOTS, loading: false, error: err });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}
