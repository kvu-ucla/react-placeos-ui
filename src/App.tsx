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
          {/* Conditionally render routes based on auth state */}
          {isAuthenticated && (
            <>
              <Route path="/" element={<BootstrapPage />} />
              <Route path="/:system_id" element={<MainView />} />
            </>
          )}
          {/* You could add a catch-all or a "not found" page here */}
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

// const [ready, setReady] = useState(false);
// const [power, setPower] = useState<boolean>(false);
// const KEY = import.meta.env.VITE_APP_KEY;
// window.debug = true;
//
// useEffect(() => {
//     (async () => {
//         try {
//
//             // Setup PlaceOS in mock mode
//             await setup({
//                 host: 'ucla-dev.placeos.run',
//                 auth_uri: '/auth/oauth/authorize',
//                 token_uri: '/auth/oauth/token',
//                 redirect_uri: 'http://localhost:5174/oauth-resp.html',
//                 scope: 'admin',
//                 handle_login: false,
//                 use_iframe: false,
//                 storage: 'local',
//                 mock: false,
//                 secure: true,
//                 token_header: true
//             });
//
//             //set api key
//             setAPI_Key(KEY);
//             // setAPI_Key(api_key);
//             // Register mock system
//             // registerSystem('mock-system', {
//             //     System: [
//             //         {
//             //             power: false,
//             //             $power(state: boolean) {
//             //                 this.power = state;
//             //             }
//             //         }
//             //     ]
//             // });
//
//             querySystems({limit: 10}).toPromise().then((res) => {
//                 console.log(res!.data);
//             });
//
//             const mod = getModule('sys-Ic6SL_lDwR', 'System');
//             const powerBinding = mod.binding('active');
//             console.log('Initial power value:', powerBinding);
//             const unbind = powerBinding.bind();
//             const powerSub = powerBinding.listen().subscribe(
//                 value => {
//                     console.log("Power Value: ", value);
//                     if (value != null)
//                         setPower(value);
//                 });
//
//             const tab = getModule('sys-Ic6SL_lDwR', 'System');
//             const tabBinding = tab.binding('tabs');
//             console.log('Initial tab value:', tabBinding);
//             const unbindTab = tabBinding.bind();
//             const tabSub = tabBinding.listen().subscribe(
//                 value => {
//                     console.log("Tab Value: ", value);
//                 });
//
//
//             // const mod = getModule(id, 'System');
//             // const binding = mod.binding(name);
//             // const unbind = binding.bind();
//             // this.subscription(`binding:${name}`, unbind);
//             // return binding.listen();
//             setReady(true);
//
//             return () => {
//                 powerSub.unsubscribe();
//                 tabSub.unsubscribe();
//                 unbind();
//                 unbindTab();
//             };
//         } catch (error) {
//             console.error('Error during PlaceOS setup:', error);
//         }
//     })();
// }, []);
//
// if (!ready) return <div>Setting up PlaceOS...</div>;
//
// const togglePower = async () => {
//     const mod = getModule('sys-Ic6SL_lDwR', 'System');
//     console.log("current power state ", power);
//     await mod.execute('power', [!power]).then(
//         (resp) => console.log("Success: ", resp),
//         (err) => console.log("Error: ", err)
//     );
// };
//
// console.log("toggle power", togglePower);
//
//
// return (
//     // <div className="p-4">
//     //     <div className="mt-4">
//     //         <h2>Power</h2>
//     //         <button onClick={togglePower} className="px-4 py-2 bg-blue-600 text-white rounded">
//     //             Turn {power ? 'Off' : 'On'}
//     //         </button>
//     //         <p>Current Power State: {power ? 'On' : 'Off'}</p>
//     //     </div>
//     //     <div className="text-3xl font-bold underline">
//     //         Hello world!
//     //     </div>
//     // </div>
//     <ControlStateProvider systemID={"sys-Ic6SL_lDwR"}><MainView></MainView></ControlStateProvider>
//
// );
