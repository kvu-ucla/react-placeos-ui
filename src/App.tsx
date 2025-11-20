// src/App.tsx
// import {useEffect, useState} from 'react';
// import {getModule, querySystems, setAPI_Key, setup} from '@placeos/ts-client';
// import {ControlStateProvider} from "./hooks/ControlStateContext.tsx";
import MainView from "./components/MainView";
import { useAuth } from "./AuthContext";
import { Route, Routes } from "react-router-dom";
import BootstrapPage from "./BootstrapPage";
import {ToastContainer} from "react-toastify";


function App() {
  const { isAuthenticated, loading } = useAuth()!;
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  return (
    <>
      <main>
        <Routes>
          <Route path="/" element={<BootstrapPage />} />
          {isAuthenticated && (
            <>
              <Route path="/" element={<BootstrapPage />} />
              <Route path="/:system_id" element={<MainView />} />
            </>
          )}
        </Routes>
        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            pauseOnHover
            draggable
            theme="light"
        />  
      </main>
    </>
  );
}
export default App;
